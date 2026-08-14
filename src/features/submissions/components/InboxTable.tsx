"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { useMessageUnreadCounts } from "@/features/conversations/hooks/useMessageUnreadCounts";
import { useJobs } from "@/features/jobs";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { formatDate } from "@/shared/utils/formatDate";
import { useSubmissions } from "../hooks/useSubmissions";
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

interface InboxTableProps {
  status?: SubmissionStatus;
  jobId?: string;
}

export function InboxTable({ status, jobId }: InboxTableProps) {
  const submissions = useSubmissions({ limit: 50, status, jobId });
  // Submissions carry only jobId. One jobs fetch builds a lookup, rather than a
  // request per row.
  const jobs = useJobs({ limit: 100 });
  const jobTitles = new Map(
    jobs.data?.data.map((job) => [job.id, job.title]) ?? [],
  );
  const { data: unreadCounts } = useMessageUnreadCounts();

  if (submissions.isPending) {
    return <TableSkeleton />;
  }

  if (submissions.isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load submissions.
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => void submissions.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (submissions.data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9D2E3] bg-card px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Inbox className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            No submissions yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Recruiters can only submit candidates to your{" "}
            <Link
              href="/company/jobs"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              published jobs
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-left">
          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Recruiter</th>
            <th className="px-4 py-3 font-medium">Received</th>
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
                <span className="flex items-center gap-2">
                  {jobTitles.get(submission.jobId) ?? "—"}
                  <UnreadBadge count={unreadCounts?.get(submission.id) ?? 0} />
                </span>
              </td>
              <td className="px-4 py-3 text-foreground">
                {recruiterDisplayName(submission.recruiter)}
                {submission.recruiter?.yearsExperience !== null &&
                  submission.recruiter !== null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {submission.recruiter.yearsExperience} yrs
                    </span>
                  )}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {formatDate(submission.createdAt)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={SUBMISSION_STATUS_LABELS[submission.status]}
                  className={STATUS_STYLES[submission.status]}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/company/inbox/${submission.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Review
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
