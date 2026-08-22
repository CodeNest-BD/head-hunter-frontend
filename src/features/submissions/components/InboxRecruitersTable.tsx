"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Users } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { Button } from "@/shared/ui-components/controls/button";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
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
import { useInboxRecruiters } from "../hooks/useSubmissions";
import {
  SUBMISSION_STATUS_FILTER_OPTIONS,
  SUBMISSION_STATUS_LABELS,
  recruiterDisplayName,
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
  { key: "recruiter", label: "Recruiter", required: true },
  { key: "rating", label: "Rating" },
  { key: "candidates", label: "Candidates" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", required: true },
];

/**
 * Level 2 of the company inbox: the recruiters who submitted to one job,
 * best-reviewed first (the server sorts by rating). Each row opens the
 * existing conversation workspace for that submission.
 */
export function InboxRecruitersTable({ jobId }: { jobId: string }) {
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
  const cols = useVisibleColumns("company.inbox.recruiters.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useInboxRecruiters(jobId, {
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
  });

  const toolbar = (
    <div className={TABLE_TOOLBAR}>
      <div className="flex-1">
        <ListToolbar
          query={qInput}
          onQueryChange={setQInput}
          placeholder="Search recruiters by name…"
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

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {toolbar}
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toolbar}

      {isPending ? (
        <TableSkeleton />
      ) : data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Users className="h-6 w-6" />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            No recruiters found
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When a recruiter submits candidates, they appear here —
            best-reviewed first.
          </p>
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={TABLE_SCROLL}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <th className={TABLE_TH}>Recruiter</th>
                  {cols.isVisible("rating") && (
                    <th className={TABLE_TH}>Rating</th>
                  )}
                  {cols.isVisible("candidates") && (
                    <th className={TABLE_TH}>Candidates</th>
                  )}
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
                {data.data.map((row) => (
                  <tr key={row.submissionId} className={TABLE_ROW}>
                    <td className={`${TABLE_TD} font-semibold text-navy`}>
                      <span className="flex items-center gap-2">
                        {recruiterDisplayName(row.recruiter)}
                        {row.recruiter?.yearsExperience != null && (
                          <span className="text-xs font-normal text-brand-gray">
                            {row.recruiter.yearsExperience} yrs
                          </span>
                        )}
                        <UnreadBadge count={row.unreadMessages} />
                      </span>
                    </td>
                    {cols.isVisible("rating") && (
                      <td className={`${TABLE_TD} whitespace-nowrap`}>
                        <RatingStars
                          value={row.recruiter?.ratingAvg ?? null}
                          count={row.recruiter?.ratingCount}
                        />
                      </td>
                    )}
                    {cols.isVisible("candidates") && (
                      <td className={`${TABLE_TD} tabular-nums text-navy`}>
                        {row.candidateCount}
                      </td>
                    )}
                    {cols.isVisible("submitted") && (
                      <td
                        className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                      >
                        {formatDate(row.submittedAt)}
                      </td>
                    )}
                    {cols.isVisible("status") && (
                      <td className={TABLE_TD}>
                        <StatusBadge
                          label={SUBMISSION_STATUS_LABELS[row.status]}
                          className={STATUS_STYLES[row.status]}
                        />
                      </td>
                    )}
                    <td className={`${TABLE_TD} text-right`}>
                      <Link
                        href={`/company/inbox/${row.submissionId}`}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
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
          <TablePager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={limit}
            onPage={setPage}
            onPageSize={changeLimit}
          />
        </div>
      )}
    </div>
  );
}
