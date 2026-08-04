"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/features/auth";
import {
  ROLE_CATEGORIES,
  ROLE_CATEGORY_LABELS,
  useJobMap,
  useJobs,
  type RoleCategory,
} from "@/features/jobs";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { formatMinor } from "@/shared/utils/money";

interface Filters {
  q: string;
  roleCategory: RoleCategory | "";
  locationState: string;
}

/**
 * The SOW's job map, as a state-by-state table rather than a rendered map:
 * the aggregate is the useful part, and a real map is its own piece of work.
 * Clicking a state filters the list below, which is what the map is for.
 */
function StateSummary({
  filters,
  onPickState,
}: {
  filters: Filters;
  onPickState: (state: string) => void;
}) {
  const { data, isPending, isError } = useJobMap({
    q: filters.q || undefined,
    roleCategory: filters.roleCategory || undefined,
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading map…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Map unavailable. Activate your subscription on your{" "}
        <Link href="/recruiter/profile" className="underline">
          profile
        </Link>{" "}
        to browse jobs.
      </p>
    );
  }
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No published jobs yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((entry) => {
        const active = filters.locationState === entry.locationState;
        return (
          <button
            key={entry.locationState}
            type="button"
            onClick={() => onPickState(active ? "" : entry.locationState)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              active ? "border-primary bg-accent" : "hover:border-zinc-400"
            }`}
          >
            <span className="font-semibold">{entry.locationState}</span>
            <span className="ml-2 text-muted-foreground">
              {entry.openRoles} {entry.openRoles === 1 ? "role" : "roles"}
            </span>
            <span className="ml-2 text-muted-foreground">
              avg {formatMinor(entry.averageFeeMinor)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function JobsList({ filters }: { filters: Filters }) {
  const { data, isPending, isError, error, refetch } = useJobs({
    limit: 20,
    q: filters.q || undefined,
    roleCategory: filters.roleCategory || undefined,
    locationState: filters.locationState || undefined,
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading jobs…</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-medium">Jobs are not available yet</p>
        <p className="text-sm text-muted-foreground">
          Only subscribed recruiters can browse jobs.{" "}
          <Link href="/recruiter/profile" className="underline">
            Activate your subscription
          </Link>{" "}
          to continue. (
          {(error as Error | undefined)?.message ?? "request failed"})
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No jobs match those filters.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.data.map((job) => (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className="block rounded-xl border p-4 transition hover:border-zinc-400"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {ROLE_CATEGORY_LABELS[job.roleCategory]} ·{" "}
                  {job.isRemote
                    ? "Remote"
                    : [job.locationCity, job.locationState]
                        .filter(Boolean)
                        .join(", ") || "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">
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
  const [locationState, setLocationState] = useState("");
  const q = useDebouncedValue(search, 300);
  const filters: Filters = { q, roleCategory, locationState };

  return (
    <RequireRole role="recruiter">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Job map</h1>
          <p className="text-sm text-muted-foreground">
            Open roles by state, and the average fee companies are offering.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="search">Search titles</Label>
            <Input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Engineer"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={roleCategory}
              onChange={(event) =>
                setRoleCategory(event.target.value as RoleCategory | "")
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
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

        <StateSummary filters={filters} onPickState={setLocationState} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {locationState ? `Jobs in ${locationState}` : "All open roles"}
          </h2>
          {locationState && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocationState("")}
            >
              Clear state
            </Button>
          )}
        </div>

        <JobsList filters={filters} />
      </main>
    </RequireRole>
  );
}
