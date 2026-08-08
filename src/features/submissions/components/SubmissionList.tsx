"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Send } from "lucide-react";

import { useJobs } from "@/features/jobs";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { useSubmissions } from "../hooks/useSubmissions";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "../schemas";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "text-[#92610C] bg-[#FBF3DF]",
  advanced: "text-[#17734E] bg-[#E7F4EC]",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="h-11 w-full animate-pulse bg-muted/50" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-t border-border/60 px-4 py-3.5"
        >
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

/**
 * The recruiter's own submissions across every job. Candidate counts are
 * deliberately absent: fetching them per row would be N+1, so the count lives
 * on the detail page instead.
 */
export function SubmissionList() {
  const [page, setPage] = useState(1);
  const submissions = useSubmissions({ page, limit: PAGE_SIZE });
  // Submissions carry only jobId. One jobs fetch builds a lookup, rather than a
  // request per row (mirrors InboxTable).
  const jobs = useJobs({ limit: 100 });
  const jobTitles = new Map(
    jobs.data?.data.map((job) => [job.id, job.title]) ?? [],
  );

  if (submissions.isPending) {
    return <TableSkeleton />;
  }

  if (submissions.isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load your submissions.
        </div>
        <button
          type="button"
          className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
          onClick={() => void submissions.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (submissions.data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9D2E3] bg-card px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Send className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            No submissions yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Browse the{" "}
            <Link
              href="/jobs"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              job map
            </Link>{" "}
            and submit your first candidate.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = submissions.data.meta.totalPages;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-border/70 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/70 bg-muted/40 text-left">
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {submissions.data.data.map((submission) => (
              <tr
                key={submission.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {jobTitles.get(submission.jobId) ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {submission.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_STYLES[submission.status],
                    )}
                  >
                    {SUBMISSION_STATUS_LABELS[submission.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/recruiter/submissions/${submission.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
