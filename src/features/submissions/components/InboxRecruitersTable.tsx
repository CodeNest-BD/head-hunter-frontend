"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Users } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { Button } from "@/shared/ui-components/controls/button";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
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
  rejected: "bg-[#FBEAEA] text-[#9B3535]",
  withdrawn: "bg-[#EEF1F6] text-[#616676]",
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
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
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
      <div className={TABLE_CARD}>
        <div className={TABLE_SCROLL}>
          <table className={TABLE_EL}>
            <thead className={TABLE_HEAD}>
              <tr className={TABLE_HEAD_ROW}>
                <th className={TABLE_TH}>Recruiter</th>
                <th className={TABLE_TH}>Rating</th>
                <th className={TABLE_TH}>Candidates</th>
                <th className={TABLE_TH}>Submitted</th>
                <th className={TABLE_TH}>Status</th>
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
                  <td className={`${TABLE_TD} whitespace-nowrap`}>
                    <RatingStars
                      value={row.recruiter?.ratingAvg ?? null}
                      count={row.recruiter?.ratingCount}
                    />
                  </td>
                  <td className={`${TABLE_TD} tabular-nums text-navy`}>
                    {row.candidateCount}
                  </td>
                  <td
                    className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                  >
                    {formatDate(row.submittedAt)}
                  </td>
                  <td className={TABLE_TD}>
                    <StatusBadge
                      label={SUBMISSION_STATUS_LABELS[row.status]}
                      className={STATUS_STYLES[row.status]}
                    />
                  </td>
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
