"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Search, SearchX } from "lucide-react";

import { useAuth } from "@/features/auth";
import { useVerificationGate } from "@/features/recruiters";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

import type { JobListParams } from "../api/jobs";
import { useJobMap, useJobs } from "../hooks/useJobs";
import {
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  type Job,
  type RoleCategory,
} from "../schemas";
import { DecorativeUsMap } from "@/components/landing/DecorativeUsMap";
import { US_STATE_NAME_BY_CODE } from "@/shared/data/usStatesGeo";
import { PublicJobCard } from "./PublicJobCard";
import { UsJobMap, type MapSelection } from "./UsJobMap";

const PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

/** Price-range buckets from the reference's "Price Range" filter. */
interface FeeBucket {
  value: string;
  label: string;
  feeMin?: number;
  feeMax?: number;
}

const FEE_BUCKETS: readonly FeeBucket[] = [
  { value: "any", label: "Any" },
  { value: "lt5000", label: "Under $5,000", feeMax: 500_000 },
  {
    value: "5000-10000",
    label: "$5,000 – $10,000",
    feeMin: 500_000,
    feeMax: 1_000_000,
  },
  { value: "gt10000", label: "$10,000+", feeMin: 1_000_000 },
];

const ANY_CATEGORY = "all";

type SortField = "publishedAt" | "recruiterFeeMinor";

interface Filters {
  roleCategory: string;
  feeBucket: string;
  q: string;
  sort: SortField;
  selection: MapSelection;
}

const INITIAL_FILTERS: Filters = {
  roleCategory: ANY_CATEGORY,
  feeBucket: "any",
  q: "",
  sort: "publishedAt",
  selection: { kind: "none" },
};

/**
 * The explore-jobs experience: the live state-bubble map and, below it, the
 * job grid — both locked behind recruiter verification (a guest or pending
 * recruiter sees an explanation and a sign-up CTA instead of any title,
 * company or fee). Companies and admins are never gated: `useVerificationGate`
 * already treats every non-recruiter as approved.
 */
export function ExploreJobsView() {
  const { isApproved, status } = useVerificationGate();
  const { status: sessionStatus, user } = useAuth();
  const signedIn = sessionStatus === "authenticated" && user !== null;
  // A recruiter whose status is anything but verified reads as "pending" (an
  // explanation to wait); a guest or other non-recruiter reads as a sign-up
  // prompt instead — `status` is undefined for every non-recruiter.
  const pending = status !== undefined && status !== "verified";
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_SIZE);
  const debouncedQ = useDebouncedValue(filters.q, 300);

  const bucket =
    FEE_BUCKETS.find((entry) => entry.value === filters.feeBucket) ??
    FEE_BUCKETS[0];
  const selectedState =
    filters.selection.kind === "none" ? undefined : filters.selection.state;

  const listParams = useMemo(
    (): JobListParams => ({
      roleCategory:
        filters.roleCategory === ANY_CATEGORY
          ? undefined
          : filters.roleCategory,
      feeMin: bucket.feeMin,
      feeMax: bucket.feeMax,
      q: debouncedQ.trim() || undefined,
      locationState: selectedState,
      sortBy: filters.sort,
      limit,
    }),
    [
      filters.roleCategory,
      filters.sort,
      bucket,
      debouncedQ,
      selectedState,
      limit,
    ],
  );

  const setFilter = (patch: Partial<Filters>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const headline =
    selectedState !== undefined
      ? (US_STATE_NAME_BY_CODE[selectedState] ?? selectedState)
      : "All States";

  return (
    <div className={signedIn ? "w-full pb-12" : "w-full px-5 pb-20 md:px-10"}>
      {/* The pitch is for people who have not signed up yet. Someone already
          signed in came to work the map, so they get a one-line heading
          instead of a screen of marketing copy to scroll past. */}
      {signedIn ? (
        <section className="pb-6">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-navy">
            Job map
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            Pick a state to see the roles open there and the fee each company is
            offering.
          </p>
        </section>
      ) : (
        <section className="pb-10 pt-12 text-center">
          <h1 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold tracking-[-0.02em] text-navy md:text-5xl">
            Set Your Price.{" "}
            <span className="text-primary">Hire the Right Talent.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-gray">
            Empower your recruitment by defining your own success fee. We
            connect companies with top-tier recruiters willing to find your
            perfect match within your budget.
          </p>
        </section>
      )}

      <MapSection
        isApproved={isApproved}
        pending={pending}
        listParams={listParams}
        selection={filters.selection}
        onSelect={(selection) => setFilter({ selection })}
      />

      <section className="mt-12">
        {isApproved ? (
          <JobsSection
            filters={filters}
            setFilter={setFilter}
            listParams={listParams}
            page={page}
            onPage={setPage}
            onLimit={(next) => {
              setLimit(next);
              setPage(1);
            }}
            headline={headline}
          />
        ) : (
          <JobsLockedSection pending={pending} />
        )}
      </section>
    </div>
  );
}

/** The icon + heading + explanation + CTA shown wherever recruiter
 * verification gates content on this page — the live map, and below it the
 * job list — so the two locked states can't drift apart. */
function VerificationLockedMessage({
  pending,
  heading,
  pendingBody,
  guestBody,
}: {
  pending: boolean;
  heading: string;
  pendingBody: string;
  guestBody: string;
}) {
  return (
    <div className="mx-4 max-w-md rounded-md border border-brand-line bg-white p-6 text-center shadow-card-lg">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="font-heading text-lg font-extrabold text-navy">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-brand-gray">
        {pending ? pendingBody : guestBody}
      </p>
      {!pending && (
        <Button asChild className="mt-4 font-bold">
          <Link href="/signup">Sign Up as a Recruiter</Link>
        </Button>
      )}
    </div>
  );
}

function MapSection({
  isApproved,
  pending,
  listParams,
  selection,
  onSelect,
}: {
  isApproved: boolean;
  pending: boolean;
  listParams: {
    roleCategory?: string;
    feeMin?: number;
    feeMax?: number;
    q?: string;
  };
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
}) {
  if (!isApproved) {
    return (
      <section className="relative overflow-hidden rounded-md border border-brand-line bg-white p-6 shadow-card">
        <div className="pointer-events-none select-none opacity-60 blur-[3px]">
          <DecorativeUsMap />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/55">
          <VerificationLockedMessage
            pending={pending}
            heading="The live map is for verified recruiters"
            pendingBody="Your account is awaiting verification. Once an admin approves your recruiting experience, live per-state demand unlocks here."
            guestBody="Sign up as a recruiter and get verified to see live openings and average fees in every state."
          />
        </div>
      </section>
    );
  }

  return (
    <LiveMap
      listParams={listParams}
      selection={selection}
      onSelect={onSelect}
    />
  );
}

/** Mounted only for approved visitors — a guest or pending recruiter never
 * fires /jobs/map. */
function LiveMap({
  listParams,
  selection,
  onSelect,
}: {
  listParams: {
    roleCategory?: string;
    feeMin?: number;
    feeMax?: number;
    q?: string;
  };
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
}) {
  const map = useJobMap({
    roleCategory: listParams.roleCategory,
    feeMin: listParams.feeMin,
    feeMax: listParams.feeMax,
    q: listParams.q,
  });

  const stats = useMemo(() => {
    const byState = new Map<
      string,
      { openRoles: number; averageFeeMinor: number }
    >();
    for (const entry of map.data ?? []) {
      byState.set(entry.locationState, {
        openRoles: entry.openRoles,
        averageFeeMinor: entry.averageFeeMinor,
      });
    }
    return byState;
  }, [map.data]);

  return (
    <section className="rounded-md border border-brand-line bg-white p-4 shadow-card sm:p-6">
      <UsJobMap stats={stats} selection={selection} onSelect={onSelect} />
    </section>
  );
}

/** The locked stand-in for the job grid: same message component and card
 * chrome the empty/error states below already use, so an unapproved visitor
 * sees an explanation instead of any title, company or fee. */
function JobsLockedSection({ pending }: { pending: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-center rounded-md border border-brand-line bg-white p-10 shadow-card">
      <VerificationLockedMessage
        pending={pending}
        heading="Job listings are for verified recruiters"
        pendingBody="Your account is awaiting verification. Once an admin approves your recruiting experience, open roles, companies and recruiter fees unlock here."
        guestBody="Sign up as a recruiter and get verified to see open roles, companies and recruiter fees."
      />
    </div>
  );
}

/** The result count, sort toggle, filter toolbar and job grid — mounted only
 * for an approved visitor, so /jobs is never fetched by anyone else. */
function JobsSection({
  filters,
  setFilter,
  listParams,
  page,
  onPage,
  onLimit,
  headline,
}: {
  filters: Filters;
  setFilter: (patch: Partial<Filters>) => void;
  listParams: JobListParams;
  page: number;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
  headline: string;
}) {
  const jobs = useJobs({ ...listParams, page });
  const total = jobs.data?.meta.total ?? 0;
  // Distinct categories are counted from the loaded rows, so the figure is only
  // exact when the whole result set fits on one page; otherwise it's omitted
  // rather than shown understated against the all-pages `total`.
  const singlePage = (jobs.data?.meta.totalPages ?? 1) <= 1;
  const categoryCount = new Set(
    (jobs.data?.data ?? []).map((job) => job.roleCategory),
  ).size;

  return (
    <>
      {/* State + result counts on the left, sort toggle on the right. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-extrabold text-navy sm:text-[28px]">
            {headline}
            {filters.selection.kind !== "none" && (
              <button
                type="button"
                onClick={() => setFilter({ selection: { kind: "none" } })}
                className="ml-3 align-middle text-sm font-semibold text-brand-secondary hover:underline"
              >
                Clear
              </button>
            )}
          </h2>
          <p className="mt-1 text-sm text-brand-gray">
            {total} {total === 1 ? "role" : "roles"}
            {singlePage && total > 0
              ? ` across ${categoryCount} ${
                  categoryCount === 1 ? "category" : "categories"
                }`
              : ""}
          </p>
        </div>
        <SortToggle
          value={filters.sort}
          onChange={(sort) => setFilter({ sort })}
        />
      </div>

      {/* Filter toolbar on a white card. */}
      <div className="mt-5 rounded-md border border-brand-line bg-white p-4 shadow-card">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13.5rem_13.5rem]">
          <div>
            <Label
              htmlFor="explore-q"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray"
            >
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="explore-q"
                placeholder="Job title…"
                value={filters.q}
                onChange={(event) => setFilter({ q: event.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label
              htmlFor="explore-category"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray"
            >
              Role Category
            </Label>
            <Select
              value={filters.roleCategory}
              onValueChange={(value) => setFilter({ roleCategory: value })}
            >
              <SelectTrigger id="explore-category">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_CATEGORY}>All</SelectItem>
                {ROLE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {ROLE_CATEGORY_LABELS[category as RoleCategory]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="explore-fee"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-gray"
            >
              Recruiter Fee
            </Label>
            <Select
              value={filters.feeBucket}
              onValueChange={(value) => setFilter({ feeBucket: value })}
            >
              <SelectTrigger id="explore-fee">
                <SelectValue placeholder="Any" />
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
        </div>
      </div>

      <CardsGrid
        query={jobs}
        page={page}
        pageSize={listParams.limit ?? PAGE_SIZE}
        onPage={onPage}
        onPageSize={onLimit}
      />
    </>
  );
}

/** The Most-recent / Highest-fee segmented control from the reference. */
function SortToggle({
  value,
  onChange,
}: {
  value: SortField;
  onChange: (value: SortField) => void;
}) {
  const options: { value: SortField; label: string }[] = [
    { value: "publishedAt", label: "Most recent" },
    { value: "recruiterFeeMinor", label: "Highest fee" },
  ];
  return (
    <div className="inline-flex shrink-0 rounded-md border border-brand-line bg-secondary p-1">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={
              "rounded-[6px] px-3.5 py-1.5 text-sm font-semibold transition-colors " +
              (active
                ? "bg-white text-navy shadow-sm"
                : "text-brand-gray hover:text-navy")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function CardsGrid({
  query,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  query: ReturnType<typeof useJobs>;
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
  if (data.data.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 rounded-md border border-brand-line bg-white p-12 text-center">
        <SearchX className="h-7 w-7 text-brand-gray-light" />
        <p className="font-heading font-extrabold text-navy">
          No open roles match these filters
        </p>
        <p className="text-sm text-brand-gray">
          Try a different state, category or price range.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((job: Job) => (
          <PublicJobCard key={job.id} job={job} />
        ))}
      </div>
      {/* Numbered pagination, matching the app's tables. */}
      <div className="rounded-md border border-brand-line bg-white shadow-card">
        <TablePager
          page={page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          pageSize={pageSize}
          onPage={onPage}
          onPageSize={onPageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </div>
  );
}
