"use client";

import Link from "next/link";
import { AlertCircle, Briefcase, Plus } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";
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
  expired: "text-[#9B3535] bg-[#FBEAEA]",
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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9D0DF] bg-card px-6 py-14 text-center">
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
    <div className={TABLE_CARD}>
      <div className={TABLE_SCROLL}>
        <table className={TABLE_EL}>
          <thead className={TABLE_HEAD}>
            <tr className={TABLE_HEAD_ROW}>
              <th className={TABLE_TH}>Title</th>
              <th className={TABLE_TH}>Category</th>
              <th className={TABLE_TH}>Fee</th>
              <th className={TABLE_TH}>Status</th>
            </tr>
          </thead>
          <tbody className={TABLE_BODY}>
            {data.data.map((job) => (
              <tr key={job.id} className={TABLE_ROW}>
                <td className={`${TABLE_TD} font-semibold text-navy`}>
                  <Link
                    href={`/company/jobs/${job.id}`}
                    className="transition-colors hover:text-primary hover:underline"
                  >
                    {job.title}
                  </Link>
                </td>
                <td className={`${TABLE_TD} text-brand-gray`}>
                  {ROLE_CATEGORY_LABELS[job.roleCategory]}
                </td>
                <td className={`${TABLE_TD} tabular-nums text-navy`}>
                  {formatMinor(job.recruiterFeeMinor)}
                </td>
                <td className={TABLE_TD}>
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
    </div>
  );
}
