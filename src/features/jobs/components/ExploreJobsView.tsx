"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, SearchX } from "lucide-react";

import { useIsVerifiedRecruiter } from "@/features/recruiters";
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

import type { PublicJobCard as PublicJobCardData } from "../publicSchemas";
import { usePublicJobs } from "../hooks/usePublicJobs";
import { useJobMap } from "../hooks/useJobs";
import {
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
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

interface Filters {
  roleCategory: string;
  feeBucket: string;
  q: string;
  selection: MapSelection;
}

const INITIAL_FILTERS: Filters = {
  roleCategory: ANY_CATEGORY,
  feeBucket: "any",
  q: "",
  selection: { kind: "none" },
};

/**
 * The public explore-jobs experience: the live state-bubble map for verified
 * recruiters (guests get a locked illustrative map), filters, and the public
 * job-card grid with an accumulating "Load more".
 */
export function ExploreJobsView() {
  const { isRecruiter, isVerified, verificationStatus } =
    useIsVerifiedRecruiter();
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
    () => ({
      roleCategory:
        filters.roleCategory === ANY_CATEGORY
          ? undefined
          : filters.roleCategory,
      feeMin: bucket.feeMin,
      feeMax: bucket.feeMax,
      q: debouncedQ.trim() || undefined,
      locationState: selectedState,
      limit,
    }),
    [filters.roleCategory, bucket, debouncedQ, selectedState, limit],
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
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      <section className="pb-10 pt-12 text-center">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold tracking-[-0.02em] text-navy md:text-5xl">
          Set Your Price.{" "}
          <span className="text-primary">Hire the Right Talent.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-gray">
          Empower your recruitment by defining your own success fee. We connect
          companies with top-tier recruiters willing to find your perfect match
          within your budget.
        </p>
      </section>

      <MapSection
        isVerified={isVerified}
        isRecruiter={isRecruiter}
        verificationStatus={verificationStatus}
        listParams={listParams}
        selection={filters.selection}
        onSelect={(selection) => setFilter({ selection })}
      />

      <section className="mt-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-heading text-2xl font-extrabold text-navy">
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
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:w-56">
              <Label
                htmlFor="explore-q"
                className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-brand-gray"
              >
                Search
              </Label>
              <Input
                id="explore-q"
                placeholder="Job title…"
                value={filters.q}
                onChange={(event) => setFilter({ q: event.target.value })}
              />
            </div>
            <div className="sm:w-48">
              <Label
                htmlFor="explore-category"
                className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-brand-gray"
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
            <div className="sm:w-44">
              <Label
                htmlFor="explore-fee"
                className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-brand-gray"
              >
                Price Range
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
          params={{ ...listParams, page }}
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
  );
}

function MapSection({
  isVerified,
  isRecruiter,
  verificationStatus,
  listParams,
  selection,
  onSelect,
}: {
  isVerified: boolean;
  isRecruiter: boolean;
  verificationStatus: string | null;
  listParams: {
    roleCategory?: string;
    feeMin?: number;
    feeMax?: number;
    q?: string;
  };
  selection: MapSelection;
  onSelect: (selection: MapSelection) => void;
}) {
  if (!isVerified) {
    const pending = isRecruiter && verificationStatus !== "verified";
    return (
      <section className="relative overflow-hidden rounded-md border border-brand-line bg-white p-6 shadow-card">
        <div className="pointer-events-none select-none opacity-60 blur-[3px]">
          <DecorativeUsMap />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/55">
          <div className="mx-4 max-w-md rounded-md border border-brand-line bg-white p-6 text-center shadow-card-lg">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-lg font-extrabold text-navy">
              The live map is for verified recruiters
            </h2>
            {pending ? (
              <p className="mt-2 text-sm text-brand-gray">
                Your account is awaiting verification. Once an admin approves
                your recruiting experience, live per-state demand unlocks here.
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

/** Mounted only for verified recruiters — guests never fire /jobs/map. */
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

function CardsGrid({
  params,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  params: Parameters<typeof usePublicJobs>[0];
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const { data, isLoading, isError } = usePublicJobs(params);

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
        {data.data.map((job: PublicJobCardData) => (
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
