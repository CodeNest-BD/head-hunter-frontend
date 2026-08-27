"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Users } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "@/features/candidates/schemas";
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
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { useListState } from "@/shared/hooks/useListState";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import type { InboxSide } from "../api/inbox";
import { useInboxCandidates } from "../hooks/useInbox";
import {
  INBOX_CANDIDATE_SORTS,
  candidateNeedsAttention,
  recruiterDisplayName,
  type InboxCandidateSort,
} from "../schemas";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "text-[#92610C] bg-[#FBF3DF]",
  interviewing: "text-[#92610C] bg-[#FBF3DF]",
  offered: "text-[#17734E] bg-[#E7F4EC]",
  hired: "text-[#17734E] bg-[#E7F4EC]",
  passed: "bg-[#FBEAEA] text-[#9B3535]",
};

const STATUS_FILTER_OPTIONS = CANDIDATE_STATUSES.map((status) => ({
  value: status,
  label: CANDIDATE_STATUS_LABELS[status],
}));

/** Narrows the toolbar's plain string back to a sort this table understands. */
const isCandidateSort = (value: string): value is InboxCandidateSort =>
  (INBOX_CANDIDATE_SORTS as readonly string[]).includes(value);

const SORT_LABELS: Record<InboxCandidateSort, string> = {
  submittedAt: "Newest first",
  recruiterRating: "Best-rated recruiter",
  candidateName: "Candidate name",
  status: "Status",
};

// Every cell below is rendered by the desktop table and the mobile card.

function NewPill() {
  return (
    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
      New
    </span>
  );
}

function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <StatusBadge
      label={CANDIDATE_STATUS_LABELS[status]}
      className={STATUS_STYLES[status]}
    />
  );
}

function OpenConversationLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
    >
      Open conversation
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/**
 * Level 2 of either inbox: one row per candidate on the selected job — one
 * thread, one row. The counterparty is a column rather than a level of its own,
 * so the company still sees who sent each candidate.
 */
export function InboxCandidatesTable({
  side,
  jobId,
  emptyAction,
}: {
  side: InboxSide;
  jobId: string;
  /**
   * Offered inside the empty state, where the reader is already looking, so
   * the only thing to do on an empty list is not stranded in a corner. Passed
   * as a node rather than a boolean flag: the recruiter side owns the submit
   * action and its form state, and the company side has no action at all.
   */
  emptyAction?: ReactNode;
}) {
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
  const isCompany = side === "company";
  const cols = useVisibleColumns(`${side}.inbox.candidates.columns`, [
    { key: "candidate", label: "Candidate", required: true },
    ...(isCompany
      ? [{ key: "recruiter", label: "Recruiter" }]
      : [{ key: "company", label: "Company" }]),
    { key: "submitted", label: "Submitted" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", required: true },
  ] satisfies ColumnDef[]);

  // Sort lives beside the filters rather than on the column headers: the
  // server owns the ordering (rating is a join it alone can do), so a header
  // click would imply a client-side sort that never happens.
  const [sortBy, setSortBy] = useState<InboxCandidateSort>("submittedAt");
  const { data, isPending, isError, refetch } = useInboxCandidates(
    side,
    jobId,
    {
      page,
      limit,
      q: q || undefined,
      status: status || undefined,
      sortBy,
    },
  );

  const threadHref = (candidateId: string): string =>
    isCompany
      ? `/company/inbox/${candidateId}`
      : `/recruiter/inbox/${candidateId}`;

  const toolbar = (
    <div className={TABLE_TOOLBAR}>
      <div className="flex-1">
        <ListToolbar
          query={qInput}
          onQueryChange={setQInput}
          placeholder={
            isCompany
              ? "Search by candidate or recruiter name…"
              : "Search by candidate name…"
          }
          filter={{
            value: status,
            onChange: changeStatus,
            allLabel: "All statuses",
            options: STATUS_FILTER_OPTIONS,
          }}
          extraFilter={{
            value: sortBy,
            onChange: (next) => {
              // "" is the toolbar's "no selection", which for a sort means the
              // default rather than an absent one.
              setSortBy(isCandidateSort(next) ? next : "submittedAt");
              setPage(1);
            },
            allLabel: SORT_LABELS.submittedAt,
            options: INBOX_CANDIDATE_SORTS.filter(
              (s) =>
                s !== "submittedAt" && (isCompany || s !== "recruiterRating"),
            ).map((s) => ({ value: s, label: SORT_LABELS[s] })),
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
            Could not load the candidates for this job.
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
            No candidates found
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {isCompany
              ? "When a recruiter sends someone to this job, they appear here — newest first."
              : "Candidates you send to this job appear here, each with its own conversation."}
          </p>
          {emptyAction}
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <th className={TABLE_TH}>Candidate</th>
                  {isCompany && cols.isVisible("recruiter") && (
                    <th className={TABLE_TH}>Recruiter</th>
                  )}
                  {!isCompany && cols.isVisible("company") && (
                    <th className={TABLE_TH}>Company</th>
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
                  <tr
                    key={row.candidateId}
                    className={cn(
                      TABLE_ROW,
                      // The same tint level 1 gives a job with new candidates,
                      // so the row the sidebar count refers to is findable.
                      candidateNeedsAttention(side, row) && "bg-primary/[0.04]",
                    )}
                  >
                    <td className={`${TABLE_TD} font-semibold text-navy`}>
                      <span className="flex items-center gap-2">
                        {row.candidateName}
                        {isCompany && row.status === "submitted" && <NewPill />}
                        <UnreadBadge count={row.unreadMessages} />
                      </span>
                    </td>
                    {isCompany && cols.isVisible("recruiter") && (
                      <td className={`${TABLE_TD} text-navy`}>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {recruiterDisplayName(row.recruiter)}
                          {row.recruiter?.yearsExperience != null && (
                            <span className="text-xs font-normal text-brand-gray">
                              {row.recruiter.yearsExperience} yrs
                            </span>
                          )}
                          <RatingStars
                            value={row.recruiter?.ratingAvg ?? null}
                            count={row.recruiter?.ratingCount}
                          />
                        </span>
                      </td>
                    )}
                    {!isCompany && cols.isVisible("company") && (
                      <td className={`${TABLE_TD} text-navy`}>
                        {row.companyName ?? "—"}
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
                        <CandidateStatusBadge status={row.status} />
                      </td>
                    )}
                    <td className={`${TABLE_TD} text-right`}>
                      <OpenConversationLink
                        href={threadHref(row.candidateId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MobileRecordList className="sm:hidden">
            {data.data.map((row) => (
              <MobileRecordCard
                key={row.candidateId}
                className={cn(
                  candidateNeedsAttention(side, row) && "bg-primary/[0.04]",
                )}
                title={row.candidateName}
                subtitle={
                  isCompany
                    ? recruiterDisplayName(row.recruiter)
                    : (row.companyName ?? undefined)
                }
                trailing={
                  <div className="flex flex-col items-end gap-1.5">
                    <CandidateStatusBadge status={row.status} />
                    {(row.unreadMessages > 0 ||
                      (isCompany && row.status === "submitted")) && (
                      <span className="flex items-center gap-1.5">
                        {isCompany && row.status === "submitted" && <NewPill />}
                        <UnreadBadge count={row.unreadMessages} />
                      </span>
                    )}
                  </div>
                }
                fields={[
                  { label: "Submitted", value: formatDate(row.submittedAt) },
                ]}
                actions={
                  <OpenConversationLink href={threadHref(row.candidateId)} />
                }
              />
            ))}
          </MobileRecordList>
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
