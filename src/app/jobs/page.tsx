"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Briefcase, MapPinned, SearchX } from "lucide-react";

import { RequireRole } from "@/features/auth";
import {
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  useJobMap,
  useJobs,
  type Job,
  type RoleCategory,
} from "@/features/jobs";
import {
  UsJobMap,
  type MapSelection,
} from "@/features/jobs/components/UsJobMap";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { BrandGlow, Eyebrow, PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { formatMinor } from "@/shared/utils/money";

interface Filters {
  q: string;
  roleCategory: RoleCategory | "";
  selection: MapSelection;
}

/** A bordered subscription/error callout, shared by the map and the list. */
function SubscriptionCallout({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-sm font-medium">Jobs are not available yet</p>
      </div>
      <p className="text-sm text-destructive/90">
        Only subscribed recruiters can browse jobs.{" "}
        <Link href="/recruiter/profile" className="underline">
          Activate your subscription
        </Link>{" "}
        to continue. ({message})
      </p>
      {onRetry && (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * The interactive map, fed by the per-state aggregates. `useJobMap` returns one
 * row per state (2-letter code); we index it into a Map for O(1) lookups in the
 * SVG. Selecting a state or city lifts the choice to the page filters.
 */
function JobMapPanel({
  filters,
  onSelect,
}: {
  filters: Filters;
  onSelect: (selection: MapSelection) => void;
}) {
  const { data, isPending, isError } = useJobMap({
    q: filters.q || undefined,
    roleCategory: filters.roleCategory || undefined,
  });

  const stats = useMemo(() => {
    const map = new Map<
      string,
      { openRoles: number; averageFeeMinor: number }
    >();
    for (const entry of data ?? []) {
      map.set(entry.locationState, {
        openRoles: entry.openRoles,
        averageFeeMinor: entry.averageFeeMinor,
      });
    }
    return map;
  }, [data]);

  if (isPending) {
    return (
      <div className="aspect-[960/600] w-full animate-pulse rounded-xl border border-border/70 bg-muted" />
    );
  }
  if (isError) {
    return <SubscriptionCallout message="map unavailable" />;
  }

  return (
    <UsJobMap stats={stats} selection={filters.selection} onSelect={onSelect} />
  );
}

/** Client-side city filter: the jobs API filters by state, not city. */
function matchesSelection(job: Job, selection: MapSelection): boolean {
  if (selection.kind !== "city") return true;
  // Job city is free-text from the posting form while the selection comes from
  // the curated city list, so normalize both sides (trim + case-fold) to avoid
  // false "no results" from casing/whitespace differences.
  return (
    (job.locationCity ?? "").trim().toLowerCase() ===
    selection.city.trim().toLowerCase()
  );
}

function JobsList({ filters }: { filters: Filters }) {
  const locationState =
    filters.selection.kind === "none" ? undefined : filters.selection.state;

  const { data, isPending, isError, error, refetch } = useJobs({
    limit: 20,
    q: filters.q || undefined,
    roleCategory: filters.roleCategory || undefined,
    locationState,
  });

  // The jobs API supports locationState but not locationCity, so a city
  // selection is applied to the returned rows here on the client.
  const jobs = useMemo(
    () =>
      (data?.data ?? []).filter((job) =>
        matchesSelection(job, filters.selection),
      ),
    [data, filters.selection],
  );

  if (isPending) {
    return (
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-20 animate-pulse rounded-xl border border-border/70 bg-muted"
          />
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <SubscriptionCallout
        message={(error as Error | undefined)?.message ?? "request failed"}
        onRetry={() => void refetch()}
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card px-6 py-12 text-center">
        <BrandGlow variant="hero" />
        <div className="relative flex flex-col items-center gap-3">
          <Eyebrow>No matches</Eyebrow>
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <p className="font-heading text-base font-semibold">
            No jobs match those filters
          </p>
          <p className="text-sm text-muted-foreground">
            Try a different state, city, or category.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className="group block rounded-xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow-black/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground group-hover:text-primary">
                  {job.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    {ROLE_CATEGORY_LABELS[job.roleCategory]}
                  </span>
                  <span>·</span>
                  <span className="truncate">
                    {job.isRemote
                      ? "Remote"
                      : [job.locationCity, job.locationState]
                          .filter(Boolean)
                          .join(", ") || "—"}
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums text-foreground">
                  {formatMinor(job.recruiterFeeMinor)}
                </p>
                <p className="text-xs text-muted-foreground">recruiter fee</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [roleCategory, setRoleCategory] = useState<RoleCategory | "">("");
  const [selection, setSelection] = useState<MapSelection>({ kind: "none" });
  const q = useDebouncedValue(search, 300);
  const filters: Filters = { q, roleCategory, selection };

  const listHeading =
    selection.kind === "city"
      ? `Jobs in ${selection.city}, ${selection.state}`
      : selection.kind === "state"
        ? `Jobs in ${selection.state}`
        : "All open roles";

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <MapPinned className="h-6 w-6 text-primary" />
              Job map
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore open roles across the US. Pick a state or city to filter
              the roles below.
            </p>
          </header>

          {/* Search + category filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="search">Search titles</Label>
              <Input
                id="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="e.g. Senior Engineer"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={roleCategory}
                onChange={(event) => {
                  const next = event.target.value;
                  setRoleCategory(
                    ROLE_CATEGORIES.includes(next as RoleCategory)
                      ? (next as RoleCategory)
                      : "",
                  );
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All categories</option>
                {ROLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {ROLE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <JobMapPanel filters={filters} onSelect={setSelection} />

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <Briefcase className="h-5 w-5 text-primary" />
                {listHeading}
              </h2>
              {selection.kind !== "none" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelection({ kind: "none" })}
                >
                  Clear
                </Button>
              )}
            </div>
            <JobsList filters={filters} />
          </section>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
