"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Search,
  SearchX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/features/auth";
import { useIsVerifiedRecruiter } from "@/features/recruiters";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

import type { PublicJobCard as PublicJobCardData } from "../publicSchemas";
import { usePublicJobs } from "../hooks/usePublicJobs";
import { useJobMap } from "../hooks/useJobs";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  type EmploymentType,
  type RoleCategory,
} from "../schemas";
import { formatSalaryRange } from "../utils/formatSalaryRange";
import { BrandGlow } from "@/shared/ui-components/brand";
import { DecorativeUsMap } from "@/components/landing/DecorativeUsMap";
import { US_STATES, US_STATE_NAME_BY_CODE } from "@/shared/data/usStatesGeo";
import { useStateCities } from "@/shared/hooks/useStateCities";
import { CityCombobox } from "@/shared/ui-components/controls/CityCombobox";
import { PublicJobCard } from "./PublicJobCard";
import { UsJobMap, type MapSelection } from "./UsJobMap";

const PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

// City is the only filter the API can't do (the public list has no city param;
// the map groups by city), so when a city is active we fetch the whole
// state-scoped result set in one page and refine + paginate it client-side.
// 100 is the backend's max page size — a comfortable ceiling for one state.
const CLIENT_FILTER_FETCH_LIMIT = 100;

/**
 * Match a Census place name against a job's free-text city: case-insensitive and
 * tolerant of the trailing "City" that some legal names carry — the dataset
 * lists Boise as "Boise City", but jobs record it as "Boise".
 */
const normalizeCityName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+city$/, "");

interface FeeBucket {
  value: string;
  label: string;
  feeMin?: number;
  feeMax?: number;
}

// Fees start at a $500 floor, so the buckets span that range upward (values in
// minor units: $500 = 50_000).
const FEE_BUCKETS: readonly FeeBucket[] = [
  { value: "any", label: "Any fee" },
  { value: "500-1k", label: "$500 – $1,000", feeMin: 50_000, feeMax: 100_000 },
  {
    value: "1k-5k",
    label: "$1,000 – $5,000",
    feeMin: 100_000,
    feeMax: 500_000,
  },
  { value: "gte5k", label: "$5,000+", feeMin: 500_000 },
];

const ANY_CATEGORY = "all";

type SortField = "publishedAt" | "recruiterFeeMinor";
type ResultView = "rows" | "cards";
type WorkMode = "" | "remote" | "onsite";

interface Filters {
  roleCategory: string;
  feeBucket: string;
  q: string;
  employment: string;
  workMode: WorkMode;
  sort: SortField;
  selection: MapSelection;
}

/**
 * How many filters are narrowing the list right now. Drives the count beside
 * the collapsed Filters header on a phone, so a filter that is silently
 * hiding results is never invisible. `sort` is ordering, not filtering.
 */
function countAppliedFilters(filters: Filters): number {
  return [
    filters.roleCategory !== ANY_CATEGORY,
    filters.feeBucket !== "any",
    filters.q !== "",
    filters.employment !== "",
    filters.workMode !== "",
    filters.selection.kind !== "none",
  ].filter(Boolean).length;
}

const INITIAL_FILTERS: Filters = {
  roleCategory: ANY_CATEGORY,
  feeBucket: "any",
  q: "",
  employment: "",
  workMode: "",
  sort: "publishedAt",
  selection: { kind: "none" },
};

/**
 * The public explore-jobs experience: a filters sidebar, the live state map for
 * verified recruiters (guests get a locked illustrative map), and the results
 * as either rows or cards. Modelled on the employer-marketplace reference.
 */
export function ExploreJobsView() {
  const { isVerified, isRecruiter, verificationStatus, isLoading } =
    useIsVerifiedRecruiter();
  const { user } = useAuth();
  // Companies and admins see the live map too, not just verified recruiters.
  const canViewLiveMap = user?.role === "admin" || user?.role === "company";
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [view, setView] = useState<ResultView>("cards");
  // A phone is one column wide either way, so the layout choice is a desktop
  // affordance: below `sm` the toggle is hidden and the denser row list is
  // always what renders, whatever `view` happens to say.
  const isCompact = useMediaQuery("(max-width: 639px)");
  const effectiveView: ResultView = isCompact ? "rows" : view;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_SIZE);
  const debouncedQ = useDebouncedValue(filters.q, 300);

  const bucket =
    FEE_BUCKETS.find((entry) => entry.value === filters.feeBucket) ??
    FEE_BUCKETS[0];
  const selectedState =
    filters.selection.kind === "none" ? undefined : filters.selection.state;
  const selectedCity =
    filters.selection.kind === "city" ? filters.selection.city : undefined;
  const isRemote =
    filters.workMode === "remote"
      ? true
      : filters.workMode === "onsite"
        ? false
        : undefined;

  const clientFilterActive = Boolean(selectedCity);

  const listParams = useMemo(
    () => ({
      roleCategory:
        filters.roleCategory === ANY_CATEGORY
          ? undefined
          : filters.roleCategory,
      employmentType: filters.employment || undefined,
      feeMin: bucket.feeMin,
      feeMax: bucket.feeMax,
      q: debouncedQ.trim() || undefined,
      locationState: selectedState,
      isRemote,
      sortBy: filters.sort,
      limit: clientFilterActive ? CLIENT_FILTER_FETCH_LIMIT : limit,
    }),
    [
      filters.roleCategory,
      filters.employment,
      filters.sort,
      bucket,
      debouncedQ,
      selectedState,
      isRemote,
      limit,
      clientFilterActive,
    ],
  );

  const jobs = usePublicJobs({
    ...listParams,
    page: clientFilterActive ? 1 : page,
  });

  const setFilter = (patch: Partial<Filters>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  // A map click just narrows the list in place — it does NOT scroll the page
  // down to the results, which was jarring when quickly comparing bubbles.
  const handleSelect = (selection: MapSelection): void => {
    setFilter({ selection });
  };

  // "View Jobs" in a bubble's popup is an explicit "take me to the results"
  // action, so it selects AND scrolls the list into view.
  const resultsRef = useRef<HTMLElement>(null);
  const handleViewJobs = (selection: MapSelection): void => {
    setFilter({ selection });
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  // City is the one filter the API can't do, so refine the fetched rows by it.
  const rows = jobs.data?.data ?? [];
  const cityKey = selectedCity ? normalizeCityName(selectedCity) : undefined;
  const filtered = rows.filter((job) => {
    if (cityKey && normalizeCityName(job.locationCity ?? "") !== cityKey) {
      return false;
    }
    return true;
  });

  // With a client filter active we hold the full result set, so slice the page
  // and derive the counts from the filtered rows; otherwise the server already
  // returned exactly one page with authoritative totals.
  const pageStart = (page - 1) * limit;
  const visible = clientFilterActive
    ? filtered.slice(pageStart, pageStart + limit)
    : filtered;
  const total = clientFilterActive
    ? filtered.length
    : (jobs.data?.meta.total ?? 0);
  const totalPages = clientFilterActive
    ? Math.max(1, Math.ceil(filtered.length / limit))
    : (jobs.data?.meta.totalPages ?? 1);

  const headline =
    selectedCity ??
    (selectedState !== undefined
      ? (US_STATE_NAME_BY_CODE[selectedState] ?? selectedState)
      : "All States");

  return (
    <div className="w-full">
      {/* Hero band — navy, centered */}
      <header className="relative overflow-hidden bg-navy px-4 py-8 text-center sm:px-5 sm:py-12 md:px-10 md:py-14">
        <BrandGlow />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-white md:text-4xl">
            Explore Live{" "}
            <span className="text-white">Fee-Backed Openings.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
            Every job on the map carries a committed recruiter fee, loaded by
            the employer before publishing and ready for secure payment to you.
            Search a specific Job type or pick a state to see open roles.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="bg-secondary px-3 py-5 sm:px-5 sm:py-8 md:px-10">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <FiltersPanel
            filters={filters}
            onChange={setFilter}
            onClear={() => {
              setFilters(INITIAL_FILTERS);
              setPage(1);
            }}
          />

          <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
            <MapCard
              isLoading={isLoading}
              canViewMap={isVerified || canViewLiveMap}
              isRecruiter={isRecruiter}
              verificationStatus={verificationStatus}
              listParams={listParams}
              selection={filters.selection}
              onSelect={handleSelect}
              onViewJobs={handleViewJobs}
            />

            <section
              ref={resultsRef}
              className="scroll-mt-24 rounded-md border border-brand-line bg-white p-4 shadow-card sm:p-5 md:p-6"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                {/* `min-w-0` + `truncate` so a long state name shortens rather
                    than pushing the sort control onto its own line. */}
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="min-w-0 truncate font-heading text-lg font-extrabold text-navy sm:text-xl">
                    {headline}
                  </h2>
                  <span className="shrink-0 text-sm text-brand-gray">
                    {total} roles
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Choosing a layout is a desktop affordance: a phone is one
                      column wide either way, and the row list is the compact
                      one, so that is what it always gets. */}
                  <div className="hidden sm:block">
                    <SegmentedToggle
                      options={[
                        {
                          value: "rows",
                          title: "Rows",
                          label: <List className="h-4 w-4" />,
                        },
                        {
                          value: "cards",
                          title: "Cards",
                          label: <LayoutGrid className="h-4 w-4" />,
                        },
                      ]}
                      value={view}
                      onChange={setView}
                    />
                  </div>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) =>
                      setFilter({
                        sort:
                          value === "recruiterFeeMinor"
                            ? "recruiterFeeMinor"
                            : "publishedAt",
                      })
                    }
                  >
                    <SelectTrigger className="w-[132px] sm:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publishedAt">Most Recent</SelectItem>
                      <SelectItem value="recruiterFeeMinor">
                        Highest Fee
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ResultsBody
                query={jobs}
                items={visible}
                total={total}
                totalPages={totalPages}
                view={effectiveView}
                page={page}
                pageSize={limit}
                onPage={setPage}
                onPageSize={(next) => {
                  setLimit(next);
                  setPage(1);
                }}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A small pill toggle used by the Employment / Work mode filters. */
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-input text-navy hover:border-primary hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

/** State filter options (incl. DC), alphabetical by name; "all" clears it. */
const STATE_OPTIONS = [...US_STATES]
  .map((state) => ({ code: state.code, name: state.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

function FiltersPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}) {
  // The city filter is scoped to the chosen state: no state → nothing to pick.
  const stateCode =
    filters.selection.kind === "none" ? undefined : filters.selection.state;
  const cityOptions = useStateCities(stateCode);
  const cityValue =
    filters.selection.kind === "city" ? filters.selection.city : null;
  // Collapsed by default below `lg`: the map is what this page is for, and an
  // expanded filter card pushes it entirely off a phone's first screen.
  const [open, setOpen] = useState(false);
  const appliedCount = countAppliedFilters(filters);

  return (
    <aside className="h-fit rounded-md border border-brand-line bg-white p-4 shadow-card sm:p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold text-navy">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex items-center gap-2 lg:pointer-events-none"
          >
            Filters
            {appliedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground lg:hidden">
                {appliedCount}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform lg:hidden",
                open && "rotate-180",
              )}
            />
          </button>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-brand-secondary hover:underline"
        >
          Clear all
        </button>
      </div>

      <div
        className={cn("mt-4 flex-col gap-5 lg:flex", open ? "flex" : "hidden")}
      >
        <div>
          <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            Search
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(event) => onChange({ q: event.target.value })}
              placeholder="Job title or company"
              aria-label="Search jobs"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            State
          </Label>
          <Select
            value={
              filters.selection.kind === "none"
                ? "all"
                : filters.selection.state
            }
            onValueChange={(value) =>
              onChange({
                selection:
                  value === "all"
                    ? { kind: "none" }
                    : { kind: "state", state: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {STATE_OPTIONS.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            City
          </Label>
          <CityCombobox
            cities={cityOptions}
            value={cityValue}
            disabled={!stateCode}
            onChange={(city) => {
              if (!stateCode) return;
              onChange({
                selection:
                  city === null
                    ? { kind: "state", state: stateCode }
                    : { kind: "city", state: stateCode, city },
              });
            }}
          />
        </div>

        <div>
          <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            Role category
          </Label>
          <Select
            value={filters.roleCategory}
            onValueChange={(value) => onChange({ roleCategory: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_CATEGORY}>All categories</SelectItem>
              {ROLE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {ROLE_CATEGORY_LABELS[category as RoleCategory]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            Recruiter fee
          </Label>
          <Select
            value={filters.feeBucket}
            onValueChange={(value) => onChange({ feeBucket: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any fee" />
            </SelectTrigger>
            <SelectContent>
              {FEE_BUCKETS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            Employment
          </p>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map((type) => (
              <FilterPill
                key={type}
                active={filters.employment === type}
                onClick={() =>
                  onChange({
                    employment: filters.employment === type ? "" : type,
                  })
                }
              >
                {EMPLOYMENT_TYPE_LABELS[type as EmploymentType]}
              </FilterPill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
            Work mode
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={filters.workMode === "remote"}
              onClick={() =>
                onChange({
                  workMode: filters.workMode === "remote" ? "" : "remote",
                })
              }
            >
              Remote
            </FilterPill>
            <FilterPill
              active={filters.workMode === "onsite"}
              onClick={() =>
                onChange({
                  workMode: filters.workMode === "onsite" ? "" : "onsite",
                })
              }
            >
              On-site
            </FilterPill>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface MapListParams {
  roleCategory?: string;
  employmentType?: string;
  feeMin?: number;
  feeMax?: number;
  q?: string;
  isRemote?: boolean;
}

function MapCard({
  isLoading,
  canViewMap,
  isRecruiter,
  verificationStatus,
  listParams,
  selection,
  onSelect,
  onViewJobs,
}: {
  isLoading: boolean;
  /** Verified recruiters and admins may read the live map. */
  canViewMap: boolean;
  isRecruiter: boolean;
  verificationStatus: string | null;
  listParams: MapListParams;
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
  onViewJobs: (selection: MapSelection) => void;
}) {
  // Session/verification is still resolving — show a loader rather than briefly
  // flashing the locked overlay to a recruiter who is in fact verified.
  if (isLoading) {
    return <LoadingMapCard />;
  }
  if (!canViewMap) {
    return (
      <LockedMapCard
        pending={isRecruiter && verificationStatus !== "verified"}
      />
    );
  }
  return (
    <LiveMapCard
      listParams={listParams}
      selection={selection}
      onSelect={onSelect}
      onViewJobs={onViewJobs}
    />
  );
}

const MAP_HEADER =
  "flex flex-col gap-3 border-b border-brand-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4";

/** A translucent bordered dot echoing the map bubbles, at a legend size. */
function LegendDot({ size }: { size: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full border border-[#2658CF] bg-[#4F80E6]/45"
      style={{ width: size, height: size }}
    />
  );
}

/** The bubble-size key, shown as a strip beneath the map so it never covers a
 * bubble (an earlier bottom-right overlay obscured the map on narrow screens). */
function BubbleSizeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-line px-4 py-3 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
        Available Fees
      </p>
      <div className="flex items-end gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <LegendDot size={8} /> Low
        </span>
        <span className="flex items-center gap-1.5">
          <LegendDot size={13} /> Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <LegendDot size={18} /> High
        </span>
      </div>
    </div>
  );
}

/** Mounted only for verified recruiters — guests never fire /jobs/map. */
function LiveMapCard({
  listParams,
  selection,
  onSelect,
  onViewJobs,
}: {
  listParams: MapListParams;
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
  onViewJobs: (selection: MapSelection) => void;
}) {
  // A chosen state narrows the map server-side, exactly like the list. A chosen
  // city does NOT collapse the map: the map stays populated so the user keeps
  // context and can switch cities in one click — the selected city is merely
  // highlighted (UsJobMap), while the results *list* is what narrows to it.
  const selectedState = selection.kind === "none" ? undefined : selection.state;

  const map = useJobMap({
    roleCategory: listParams.roleCategory,
    employmentType: listParams.employmentType,
    feeMin: listParams.feeMin,
    feeMax: listParams.feeMax,
    q: listParams.q,
    isRemote: listParams.isRemote,
    locationState: selectedState,
  });

  const cityData = map.data ?? [];

  // The map rows are per state *and* city; fold them back into per-state totals
  // (open roles and summed available fee) for the fills and hover popup.
  const stats = useMemo(() => {
    const byState = new Map<
      string,
      { openRoles: number; totalFeeMinor: number }
    >();
    for (const entry of cityData) {
      const prev = byState.get(entry.locationState) ?? {
        openRoles: 0,
        totalFeeMinor: 0,
      };
      prev.openRoles += entry.openRoles;
      prev.totalFeeMinor += entry.totalFeeMinor;
      byState.set(entry.locationState, prev);
    }
    return byState;
  }, [cityData]);

  return (
    <section className="overflow-hidden rounded-md border border-brand-line bg-white shadow-card">
      <UsJobMap
        embedded
        header={
          <div>
            <span className="font-heading text-base font-bold text-navy">
              Current Live Openings
            </span>{" "}
            <span className="text-sm text-brand-gray">
              The live map is for verified recruiters
            </span>
          </div>
        }
        legend={<BubbleSizeLegend />}
        stats={stats}
        cityData={cityData}
        selection={selection}
        onSelect={onSelect}
        onViewJobs={onViewJobs}
      />
    </section>
  );
}

/** Shown while the session/verification query resolves — no locked flash. */
function LoadingMapCard() {
  return (
    <section className="overflow-hidden rounded-md border border-brand-line bg-white shadow-card">
      <div className={MAP_HEADER}>
        <div>
          <span className="font-heading text-base font-bold text-navy">
            Current Live Openings
          </span>{" "}
          <span className="text-sm text-brand-gray">Loading your map…</span>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-24 sm:px-5">
        <Loader2 className="h-6 w-6 animate-spin text-brand-gray" />
      </div>
    </section>
  );
}

function LockedMapCard({ pending }: { pending: boolean }) {
  return (
    <section className="overflow-hidden rounded-md border border-brand-line bg-white shadow-card">
      <div className={MAP_HEADER}>
        <div>
          <span className="font-heading text-base font-bold text-navy">
            Current Live Openings
          </span>{" "}
          <span className="text-sm text-brand-gray">
            The live map is for verified recruiters
          </span>
        </div>
      </div>
      <div className="relative p-3 sm:p-5">
        <div className="pointer-events-none select-none opacity-60 blur-[3px]">
          <DecorativeUsMap />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/55">
          <div className="mx-4 max-w-md rounded-md border border-brand-line bg-white p-6 text-center shadow-card-lg">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="font-heading text-lg font-extrabold text-navy">
              The live map is for verified recruiters
            </h3>
            <p className="mt-2 text-sm text-brand-gray">
              Your account is awaiting verification. Once an Admin approves it,
              you will have access to the live job map showing real-world
              openings with companies willing to pay a fee for the right
              candidate.
            </p>
            {!pending && (
              <Button asChild className="mt-4 font-bold">
                <Link href="/signup">Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  /** `title` labels icon-only options for screen readers and hover tooltips. */
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-md border border-brand-line bg-secondary p-1">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.title}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-[6px] px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-white text-navy shadow-sm"
                : "text-brand-gray hover:text-navy",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ResultsBody({
  query,
  items,
  total,
  totalPages,
  view,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  query: ReturnType<typeof usePublicJobs>;
  items: PublicJobCardData[];
  total: number;
  totalPages: number;
  view: ResultView;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const { data, isLoading, isError } = query;

  if (isLoading) {
    return (
      <div className="mt-8 flex items-center justify-center py-16 text-brand-gray">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading jobs…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="mt-8 rounded-md border border-brand-line bg-white p-10 text-center text-brand-gray">
        Jobs are unavailable right now — please try again shortly.
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 rounded-md border border-dashed border-brand-line bg-white p-12 text-center">
        <SearchX className="h-7 w-7 text-brand-gray-light" />
        <p className="font-heading font-extrabold text-navy">
          No open roles match these filters
        </p>
        <p className="text-sm text-brand-gray">
          Try a different state, category, fee or employment type.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((job) => (
            <PublicJobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-brand-line">
          {/* Column template is repeated on JobRow below — the two must stay
           * in step. Salary earns its own column only from `xl`: the filters
           * rail leaves the results about 600px at `lg`, which four columns
           * already fill. */}
          <div className="hidden grid-cols-[minmax(0,1fr)_12rem_10rem_8rem] gap-6 border-b border-brand-line bg-secondary/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray md:grid xl:grid-cols-[minmax(0,1fr)_9.5rem_10.5rem_9rem_7rem]">
            <span>Role</span>
            <span>Terms</span>
            <span className="hidden xl:block">Pay</span>
            <span>Recruiter fee</span>
            <span className="text-right">Posted</span>
          </div>
          <ul className="divide-y divide-brand-line">
            {items.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-brand-line bg-white shadow-card">
        <TablePager
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPage={onPage}
          onPageSize={onPageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-brand-line px-2.5 py-0.5 text-xs font-medium text-brand-gray">
      {children}
    </span>
  );
}

function JobRow({ job }: { job: PublicJobCardData }) {
  const location = job.isRemote
    ? "Remote"
    : [job.locationCity, job.locationState].filter(Boolean).join(", ") || "—";
  const posted = job.publishedAt
    ? formatDistanceToNow(job.publishedAt, { addSuffix: true })
    : "—";
  const category =
    ROLE_CATEGORY_LABELS[job.roleCategory as RoleCategory] ?? "Other";
  const employment = job.employmentType
    ? (EMPLOYMENT_TYPE_LABELS[job.employmentType as EmploymentType] ?? null)
    : null;
  const salary = formatSalaryRange(job);

  return (
    <li className="grid grid-cols-1 gap-2.5 px-3 py-3.5 sm:gap-3 sm:px-4 sm:py-4 md:grid-cols-[minmax(0,1fr)_12rem_10rem_8rem] md:items-center md:gap-6 xl:grid-cols-[minmax(0,1fr)_9.5rem_10.5rem_9rem_7rem]">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
          {category}
        </p>
        <p className="mt-0.5 truncate font-heading text-[15px] font-bold text-navy">
          {job.title}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-brand-gray">
          <CompanyLogo
            companyProfileId={job.companyProfileId}
            hasLogo={job.hasLogo}
            name={job.companyName || "A company"}
            size="xs"
          />
          <span className="truncate">
            {job.companyName || "A company"} · {location}
          </span>
        </div>
        {/* Below `xl` there is no salary column, so it rides under the role;
         * from `xl` the cell after Terms carries it. */}
        {salary && (
          <p className="mt-0.5 truncate text-[13px] font-semibold text-navy xl:hidden">
            {salary}
            <span className="ml-1.5 text-xs font-medium text-brand-gray">
              salary
            </span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {employment && <Tag>{employment}</Tag>}
      </div>
      <div className="hidden text-sm font-semibold text-navy xl:block">
        {salary ?? <span className="font-normal text-brand-gray">—</span>}
      </div>
      <div className="whitespace-nowrap">
        <span className="font-heading text-lg font-extrabold text-primary">
          {job.recruiterFeeMinor === 0
            ? "Free"
            : formatMinor(job.recruiterFeeMinor)}
        </span>{" "}
        <span className="text-xs text-brand-gray">on hire</span>
      </div>
      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-1">
        <span className="text-xs tabular-nums text-brand-gray-light">
          {posted}
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/jobs/${job.id}`}>View</Link>
        </Button>
      </div>
    </li>
  );
}
