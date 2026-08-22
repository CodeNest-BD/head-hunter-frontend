"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Send } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { useMessageUnreadCounts } from "@/features/conversations/hooks/useMessageUnreadCounts";
import { useJobs } from "@/features/jobs";
import { PageBanner } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { ListToolbar } from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
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
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { useListState } from "@/shared/hooks/useListState";
import { formatDate } from "@/shared/utils/formatDate";
import { useSubmissions } from "../hooks/useSubmissions";
import {
  SUBMISSION_STATUS_FILTER_OPTIONS,
  SUBMISSION_STATUS_LABELS,
  submissionStatusSchema,
  type SubmissionStatus,
} from "../schemas";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "text-[#92610C] bg-[#FBF3DF]",
  advanced: "text-[#17734E] bg-[#E7F4EC]",
  rejected: "bg-[#FBEAEA] text-[#9B3535]",
  withdrawn: "bg-[#EEF1F6] text-[#616676]",
};

const COLUMNS: ColumnDef[] = [
  { key: "job", label: "Job", required: true },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", required: true },
];

/** Read a status's cross-page total from its own count query (limit 1). */
function useStatusTotal(status: SubmissionStatus): number {
  return useSubmissions({ status, limit: 1 }).data?.meta.total ?? 0;
}

/**
 * The recruiter's own submissions across every job. Candidate counts are
 * deliberately absent: fetching them per row would be N+1, so the count lives
 * on the detail page instead.
 */
export function SubmissionList() {
  const {
    page,
    setPage,
    qInput,
    setQInput,
    q,
    status,
    changeStatus,
    limit,
    changeLimit,
  } = useListState();
  const cols = useVisibleColumns("recruiter.submissions.columns", COLUMNS);
  const parsedStatus = submissionStatusSchema.safeParse(status);
  const submissions = useSubmissions({
    page,
    limit,
    q: q || undefined,
    status: parsedStatus.success ? parsedStatus.data : undefined,
  });

  // Banner "where do I stand" counts, accurate across pages via per-status
  // totals. There is no "hired" submission status — "advanced" is the furthest
  // positive state — so the third metric reports Advanced.
  const submittedTotal = useStatusTotal("submitted");
  const underReviewTotal = useStatusTotal("under_review");
  const advancedTotal = useStatusTotal("advanced");
  const activeTotal = submittedTotal + underReviewTotal + advancedTotal;

  // Submissions carry only jobId. One jobs fetch builds a lookup, rather than a
  // request per row (mirrors the inbox).
  const jobs = useJobs({ limit: 100 });
  const jobTitles = new Map(
    jobs.data?.data.map((job) => [job.id, job.title]) ?? [],
  );
  const { data: unreadCounts } = useMessageUnreadCounts();

  const toolbar = (
    <div className={TABLE_TOOLBAR}>
      <div className="flex-1">
        <ListToolbar
          query={qInput}
          onQueryChange={setQInput}
          placeholder="Search by job title…"
          filter={{
            value: status,
            onChange: changeStatus,
            allLabel: "All statuses",
            // The filter offers all five: a submission recorded before the
            // settable set was narrowed still carries `under_review` or
            // `advanced`, and it has to stay findable.
            options: [...SUBMISSION_STATUS_FILTER_OPTIONS],
          }}
        />
      </div>
      <ColumnsToggle
        columns={cols.columns}
        isVisible={cols.isVisible}
        onToggle={cols.toggle}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Submissions"
        subtitle="Every candidate you've submitted, and where each one stands."
        metrics={[
          { label: "Active", value: activeTotal },
          { label: "Under review", value: underReviewTotal },
          { label: "Advanced", value: advancedTotal },
        ]}
      />

      <div className="flex flex-col gap-4">
        {toolbar}

        {submissions.isError ? (
          <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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
        ) : submissions.isPending ? (
          <TableSkeleton />
        ) : submissions.data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Send className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-semibold text-navy">
                No submissions found
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try a different search or filter, or{" "}
                <Link
                  href="/explore-jobs"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  explore open jobs
                </Link>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className={TABLE_CARD}>
            <div className={TABLE_SCROLL}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr className={TABLE_HEAD_ROW}>
                    <th className={TABLE_TH}>Job</th>
                    {cols.isVisible("submitted") && (
                      <th className={TABLE_TH}>Submitted</th>
                    )}
                    {cols.isVisible("status") && (
                      <th className={TABLE_TH}>Status</th>
                    )}
                    <th className={TABLE_TH} />
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {submissions.data.data.map((submission) => (
                    <tr key={submission.id} className={TABLE_ROW}>
                      <td className={`${TABLE_TD} font-semibold text-navy`}>
                        <span className="flex items-center gap-2">
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
                      {cols.isVisible("submitted") && (
                        <td
                          className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                        >
                          {formatDate(submission.createdAt)}
                        </td>
                      )}
                      {cols.isVisible("status") && (
                        <td className={TABLE_TD}>
                          <StatusBadge
                            label={SUBMISSION_STATUS_LABELS[submission.status]}
                            className={STATUS_STYLES[submission.status]}
                          />
                        </td>
                      )}
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
            <TablePager
              page={page}
              totalPages={submissions.data.meta.totalPages}
              total={submissions.data.meta.total}
              pageSize={limit}
              onPage={setPage}
              onPageSize={changeLimit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
