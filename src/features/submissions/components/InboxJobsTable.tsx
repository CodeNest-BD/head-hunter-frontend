"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
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

/**
 * Level 1 of the company inbox: one row per job, with how many submissions it
 * has (and how many are new/unread). Clicking through opens the per-job
 * recruiter table.
 */
export function InboxJobsTable() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useInboxJobs(page);

  if (isPending) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
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
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
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
    <div className="flex flex-col gap-3">
      <div className={TABLE_CARD}>
        <div className={TABLE_SCROLL}>
          <table className={TABLE_EL}>
            <thead className={TABLE_HEAD}>
              <tr className={TABLE_HEAD_ROW}>
                <th className={TABLE_TH}>Job</th>
                <th className={TABLE_TH}>Submissions</th>
                <th className={TABLE_TH}>New</th>
                <th className={TABLE_TH}>Last received</th>
                <th className={TABLE_TH}>Job status</th>
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
                  <td className={`${TABLE_TD} tabular-nums text-navy`}>
                    {row.submissionCount}
                  </td>
                  <td className={`${TABLE_TD} tabular-nums`}>
                    {row.newSubmissionCount > 0 ? (
                      <span className="font-semibold text-primary">
                        {row.newSubmissionCount}
                      </span>
                    ) : (
                      <span className="text-brand-gray-light">0</span>
                    )}
                  </td>
                  <td
                    className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                  >
                    {formatDate(row.lastSubmittedAt)}
                  </td>
                  <td className={TABLE_TD}>
                    <StatusBadge
                      label={JOB_STATUS_LABELS[row.jobStatus]}
                      className={JOB_STATUS_STYLES[row.jobStatus]}
                    />
                  </td>
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
      </div>
      {data.meta.totalPages > 1 && (
        <div className={TABLE_CARD}>
          <TablePager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={data.meta.limit}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
