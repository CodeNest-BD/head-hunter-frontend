"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Send } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { useMessageUnreadCounts } from "@/features/conversations/hooks/useMessageUnreadCounts";
import { useJobs } from "@/features/jobs";
import { Button } from "@/shared/ui-components/controls/button";
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
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { formatDate } from "@/shared/utils/formatDate";
import { useSubmissions } from "../hooks/useSubmissions";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "../schemas";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "text-[#92610C] bg-[#FBF3DF]",
  advanced: "text-[#17734E] bg-[#E7F4EC]",
  rejected: "bg-[#FBEAEA] text-[#9B3535]",
  withdrawn: "bg-[#EEF1F6] text-[#616676]",
};

const PAGE_SIZE = 20;

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
  const { data: unreadCounts } = useMessageUnreadCounts();

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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9D0DF] bg-card px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Send className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            No submissions yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            <Link
              href="/explore-jobs"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Explore open jobs
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
      <div className={TABLE_CARD}>
        <div className={TABLE_SCROLL}>
          <table className={TABLE_EL}>
            <thead className={TABLE_HEAD}>
              <tr className={TABLE_HEAD_ROW}>
                <th className={TABLE_TH}>Job</th>
                <th className={TABLE_TH}>Submitted</th>
                <th className={TABLE_TH}>Status</th>
                <th className={TABLE_TH} />
              </tr>
            </thead>
            <tbody className={TABLE_BODY}>
              {submissions.data.data.map((submission) => (
                <tr key={submission.id} className={TABLE_ROW}>
                  <td className={`${TABLE_TD} font-semibold text-navy`}>
                    <span className="flex items-center gap-2">
                      {/* Job title links to the job details page (client ask);
                          the row's "View" opens the submission workspace. */}
                      <Link
                        href={`/jobs/${submission.jobId}`}
                        className="hover:text-primary hover:underline"
                      >
                        {jobTitles.get(submission.jobId) ?? "—"}
                      </Link>
                      <UnreadBadge
                        count={unreadCounts?.get(submission.id) ?? 0}
                      />
                    </span>
                  </td>
                  <td
                    className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                  >
                    {formatDate(submission.createdAt)}
                  </td>
                  <td className={TABLE_TD}>
                    <StatusBadge
                      label={SUBMISSION_STATUS_LABELS[submission.status]}
                      className={STATUS_STYLES[submission.status]}
                    />
                  </td>
                  <td className={`${TABLE_TD} text-right`}>
                    <Link
                      href={`/recruiter/submissions/${submission.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
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
      </div>

      {totalPages > 1 && (
        <div className={TABLE_CARD}>
          <TablePager
            page={page}
            totalPages={totalPages}
            total={submissions.data.meta.total}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
