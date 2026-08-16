"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Users } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { Button } from "@/shared/ui-components/controls/button";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { formatDate } from "@/shared/utils/formatDate";
import { useInboxRecruiters } from "../hooks/useSubmissions";
import {
  SUBMISSION_STATUS_LABELS,
  recruiterDisplayName,
  type SubmissionStatus,
} from "../schemas";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "text-[#92610C] bg-[#FBF3DF]",
  advanced: "text-[#17734E] bg-[#E7F4EC]",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

/**
 * Level 2 of the company inbox: the recruiters who submitted to one job,
 * best-reviewed first (the server sorts by rating). Each row opens the
 * existing conversation workspace for that submission.
 */
export function InboxRecruitersTable({ jobId }: { jobId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useInboxRecruiters(jobId, page);

  if (isPending) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load the recruiters for this job.
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-input bg-card px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Users className="h-6 w-6" />
        </span>
        <p className="font-heading text-base font-semibold text-foreground">
          No recruiters on this job yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          When a recruiter submits candidates, they appear here — best-reviewed
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-border/70 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/70 bg-muted/40 text-left">
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Recruiter</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Candidates</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.data.map((row) => (
              <tr
                key={row.submissionId}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    {recruiterDisplayName(row.recruiter)}
                    {row.recruiter?.yearsExperience != null && (
                      <span className="text-xs text-muted-foreground">
                        {row.recruiter.yearsExperience} yrs
                      </span>
                    )}
                    <UnreadBadge count={row.unreadMessages} />
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <RatingStars
                    value={row.recruiter?.ratingAvg ?? null}
                    count={row.recruiter?.ratingCount}
                  />
                </td>
                <td className="px-4 py-3 tabular-nums text-foreground">
                  {row.candidateCount}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatDate(row.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={SUBMISSION_STATUS_LABELS[row.status]}
                    className={STATUS_STYLES[row.status]}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/company/inbox/${row.submissionId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Open conversation
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          Page {data.meta.page} of {data.meta.totalPages}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
