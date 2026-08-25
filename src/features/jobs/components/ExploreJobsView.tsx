"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid, List, Loader2, Lock, Search, SearchX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/features/auth";
import { useIsVerifiedRecruiter } from "@/features/recruiters";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
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
import { BrandGlow } from "@/shared/ui-components/brand";
import { DecorativeUsMap } from "@/components/landing/DecorativeUsMap";
import { US_STATES, US_STATE_NAME_BY_CODE } from "@/shared/data/usStatesGeo";
import { useStateCities } from "../hooks/useStateCities";
import { CityCombobox } from "./CityCombobox";
import { PublicJobCard } from "./PublicJobCard";
import { UsJobMap, type MapSelection } from "./UsJobMap";

const PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

// City and employment aren't server filters, so when either is active we fetch
// the whole (state-scoped) result set in one page and refine + paginate it
// client-side. 100 is the backend's max page size — a comfortable ceiling for a
// single state's open roles.
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

  const clientFilterActive = Boolean(selectedCity || filters.employment);

  const listParams = useMemo(
    () => ({
      roleCategory:
        filters.roleCategory === ANY_CATEGORY
          ? undefined
          : filters.roleCategory,
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

  // The map sits above the list, so picking a state brings the now-filtered
  // results into view rather than leaving the change off-screen.
  const resultsRef = useRef<HTMLDivElement>(null);
  const handleSelect = (selection: MapSelection): void => {
    setFilter({ selection });
    if (selection.kind !== "none") {
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    }
  };

  // Refine the fetched rows by the client-only filters (employment, city).
  const rows = jobs.data?.data ?? [];
  const cityKey = selectedCity ? normalizeCityName(selectedCity) : undefined;
  const filtered = rows.filter((job) => {
    if (filters.employment && job.employmentType !== filters.employment) {
      return false;
    }
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
      <header className="relative overflow-hidden bg-navy px-5 py-12 text-center md:px-10 md:py-14">
        <BrandGlow />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-white md:text-4xl">
            Set Your Price.{" "}
            <span className="text-primary">Hire the Right Talent.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
            Empower your recruitment by defining your own success fee. We
            connect companies with top-tier recruiters willing to find your
            perfect match within your budget.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="bg-secondary px-5 py-8 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <FiltersPanel
            filters={filters}
            onChange={setFilter}
            onClear={() => {
              setFilters(INITIAL_FILTERS);
              setPage(1);
            }}
          />

          <div className="flex min-w-0 flex-col gap-6">
            <MapCard
              isLoading={isLoading}
              canViewMap={isVerified || canViewLiveMap}
              isRecruiter={isRecruiter}
              verificationStatus={verificationStatus}
              listParams={listParams}
              selection={filters.selection}
              onSelect={handleSelect}
            />

            <section
              ref={resultsRef}
              className="scroll-mt-24 rounded-md border border-brand-line bg-white p-5 shadow-card sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-heading text-xl font-extrabold text-navy">
                    {headline}
                  </h2>
                  <span className="text-sm text-brand-gray">{total} roles</span>
                  {filters.selection.kind !== "none" && (
                    <button
                      type="button"
                      onClick={() => setFilter({ selection: { kind: "none" } })}
                      className="text-sm font-semibold text-brand-secondary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publishedAt">Most recent</SelectItem>
                      <SelectItem value="recruiterFeeMinor">
                        Highest fee
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
                view={view}
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

  return (
    <aside className="h-fit rounded-md border border-brand-line bg-white p-5 shadow-card lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold text-navy">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-brand-secondary hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-5">
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
}: {
  isLoading: boolean;
  /** Verified recruiters and admins may read the live map. */
  canViewMap: boolean;
  isRecruiter: boolean;
  verificationStatus: string | null;
  listParams: MapListParams;
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
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
    />
  );
}

const MAP_HEADER =
  "flex flex-col gap-3 border-b border-brand-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between";

/** A translucent bordered dot echoing the map bubbles, at a legend size. */
function LegendDot({ size }: { size: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full border border-[#2658CF] bg-[#4F80E6]/45"
      style={{ width: size, height: size }}
    />
  );
}

/** The bubble-size key, shown as a card in the map's bottom-right (per the ref). */
function BubbleSizeLegend() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 rounded-md border border-brand-line bg-white/95 px-3 py-2 shadow-card backdrop-blur-sm">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray">
        Available fee
      </p>
      <div className="flex items-end gap-3 text-xs text-muted-foreground">
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
}: {
  listParams: MapListParams;
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
}) {
  // Selection is the single source of truth for the state/city filters (both
  // the sidebar dropdowns and map clicks write it), so the map narrows by the
  // same state/city as the results list — not just category/fee/search.
  const selectedState = selection.kind === "none" ? undefined : selection.state;
  const selectedCity = selection.kind === "city" ? selection.city : undefined;

  const map = useJobMap({
    roleCategory: listParams.roleCategory,
    feeMin: listParams.feeMin,
    feeMax: listParams.feeMax,
    q: listParams.q,
    isRemote: listParams.isRemote,
    // A chosen state narrows the map server-side, exactly like the list.
    locationState: selectedState,
  });

  // /jobs/map groups by city and has no city param, so a chosen city is applied
  // here — the same client-side city narrowing the results list uses.
  const cityData = useMemo(() => {
    const rows = map.data ?? [];
    if (!selectedCity) return rows;
    const key = normalizeCityName(selectedCity);
    return rows.filter(
      (row) => normalizeCityName(row.locationCity ?? "") === key,
    );
  }, [map.data, selectedCity]);

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
      <div className={MAP_HEADER}>
        <div>
          <span className="font-heading text-base font-bold text-navy">
            Where roles are open
          </span>{" "}
          <span className="text-sm text-brand-gray">
            Click a state or city bubble to load its roles
          </span>
        </div>
      </div>
      <div className="relative p-4 sm:p-5">
        <UsJobMap
          embedded
          stats={stats}
          cityData={cityData}
          selection={selection}
          onSelect={onSelect}
        />
        <BubbleSizeLegend />
      </div>
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
            Where roles are open
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
            Where roles are open
          </span>{" "}
          <span className="text-sm text-brand-gray">
            The live map is for verified recruiters
          </span>
        </div>
      </div>
      <div className="relative p-4 sm:p-5">
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
            {pending ? (
              <p className="mt-2 text-sm text-brand-gray">
                Your account is awaiting verification. Once an admin approves
                it, live per-state demand unlocks here.
              </p>
            ) : (
              <p className="mt-2 text-sm text-brand-gray">
                Sign up as a recruiter and get verified to see live openings and
                average fees in every state.
              </p>
            )}
            {!pending && (
              <Button asChild className="mt-4 font-bold">
                <Link href="/signup">Sign Up as a Recruiter</Link>
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
          <div className="hidden grid-cols-[minmax(0,1fr)_12rem_10rem_8rem] gap-6 border-b border-brand-line bg-secondary/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray md:grid">
            <span>Role</span>
            <span>Terms</span>
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

  return (
    <li className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_12rem_10rem_8rem] md:items-center md:gap-6">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
          {category}
        </p>
        <p className="mt-0.5 truncate font-heading text-[15px] font-bold text-navy">
          {job.title}
        </p>
        <p className="truncate text-sm text-brand-gray">
          {job.companyName || "A company"} · {location}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {employment && <Tag>{employment}</Tag>}
        <Tag>{job.isRemote ? "Remote" : "On-site"}</Tag>
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
