"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { ListToolbar } from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/columns";
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
import { useInboxJobs } from "../hooks/useSubmissions";
import type { InboxJobRow } from "../schemas";

const JOB_STATUS_STYLES: Record<InboxJobRow["jobStatus"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "text-[#17734E] bg-[#E7F4EC]",
  paused: "text-[#92610C] bg-[#FBF3DF]",
  filled: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
  expired: "text-[#9B3535] bg-[#FBEAEA]",
};

const JOB_STATUS_LABELS: Record<InboxJobRow["jobStatus"], string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  filled: "Filled",
  closed: "Closed",
  expired: "Expired",
};

const COLUMNS: ColumnDef[] = [
  { key: "job", label: "Job", required: true },
  { key: "submissions", label: "Submissions" },
  { key: "new", label: "New" },
  { key: "lastReceived", label: "Last received" },
  { key: "jobStatus", label: "Job status" },
  { key: "actions", label: "Actions", required: true },
];

/**
 * Level 1 of the company inbox: one row per job, with how many submissions it
 * has (and how many are new/unread). Clicking through opens the per-job
 * recruiter table.
 */
export function InboxJobsTable() {
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
  const cols = useVisibleColumns("company.inbox.jobs.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useInboxJobs({
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
          placeholder="Search jobs by title…"
          filter={{
            value: status,
            onChange: changeStatus,
            allLabel: "All statuses",
            options: [
              { value: "published", label: "Published" },
              { value: "paused", label: "Paused" },
              { value: "filled", label: "Filled" },
              { value: "closed", label: "Closed" },
              { value: "expired", label: "Expired" },
            ],
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
            Could not load your inbox.
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
            <Inbox className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-base font-semibold text-foreground">
              No submissions found
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
      ) : (
        <div className={TABLE_CARD}>
          <div className={TABLE_SCROLL}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <th className={TABLE_TH}>Job</th>
                  {cols.isVisible("submissions") && (
                    <th className={TABLE_TH}>Submissions</th>
                  )}
                  {cols.isVisible("new") && <th className={TABLE_TH}>New</th>}
                  {cols.isVisible("lastReceived") && (
                    <th className={TABLE_TH}>Last received</th>
                  )}
                  {cols.isVisible("jobStatus") && (
                    <th className={TABLE_TH}>Job status</th>
                  )}
                  <th className={TABLE_TH} />
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {data.data.map((row) => (
                  <tr key={row.jobId} className={TABLE_ROW}>
                    <td className={`${TABLE_TD} font-semibold text-navy`}>
                      <span className="flex items-center gap-2">
                        <Link
                          href={`/company/inbox/job/${row.jobId}`}
                          className="hover:text-primary hover:underline"
                        >
                          {row.jobTitle}
                        </Link>
                        <UnreadBadge count={row.unreadMessages} />
                      </span>
                    </td>
                    {cols.isVisible("submissions") && (
                      <td className={`${TABLE_TD} tabular-nums text-navy`}>
                        {row.submissionCount}
                      </td>
                    )}
                    {cols.isVisible("new") && (
                      <td className={`${TABLE_TD} tabular-nums`}>
                        {row.newSubmissionCount > 0 ? (
                          <span className="font-semibold text-primary">
                            {row.newSubmissionCount}
                          </span>
                        ) : (
                          <span className="text-brand-gray-light">0</span>
                        )}
                      </td>
                    )}
                    {cols.isVisible("lastReceived") && (
                      <td
                        className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                      >
                        {formatDate(row.lastSubmittedAt)}
                      </td>
                    )}
                    {cols.isVisible("jobStatus") && (
                      <td className={TABLE_TD}>
                        <StatusBadge
                          label={JOB_STATUS_LABELS[row.jobStatus]}
                          className={JOB_STATUS_STYLES[row.jobStatus]}
                        />
                      </td>
                    )}
                    <td className={`${TABLE_TD} text-right`}>
                      <Link
                        href={`/company/inbox/job/${row.jobId}`}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        View recruiters
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
