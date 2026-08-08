"use client";

import Link from "next/link";
import { AlertCircle, Briefcase, Plus } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { ROLE_CATEGORY_LABELS } from "../schemas";
import { useJobs } from "../hooks/useJobs";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "text-[#17734E] bg-[#E7F4EC]",
  paused: "text-[#92610C] bg-[#FBF3DF]",
  filled: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
};

export function JobsTable() {
  const { data, isPending, isError, refetch } = useJobs({ limit: 50 });

  if (isPending) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load jobs.
        </div>
        <button
          type="button"
          className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9D2E3] bg-card px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Briefcase className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            No jobs yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Post your first role, then publish it to notify your followers.
          </p>
        </div>
        <Link
          href="/company/jobs/new"
          className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-[18px] w-[18px]" />
          Create your first job
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-left">
          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Fee</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((job) => (
            <tr
              key={job.id}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/company/jobs/${job.id}`}
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {job.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {ROLE_CATEGORY_LABELS[job.roleCategory]}
              </td>
              <td className="px-4 py-3 tabular-nums text-foreground">
                {formatMinor(job.recruiterFeeMinor)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={job.status}
                  className={cn(
                    STATUS_STYLES[job.status] ??
                      "bg-muted text-muted-foreground",
                    "capitalize",
                  )}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
