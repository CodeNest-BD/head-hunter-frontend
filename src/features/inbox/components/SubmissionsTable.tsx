"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Briefcase, Users } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { CANDIDATE_STATUS_LABELS } from "@/features/candidates/schemas";
import { CANDIDATE_STATUS_STYLES } from "@/features/candidates/components/statusStyles";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import { ListToolbar } from "@/shared/ui-components/data/ListToolbar";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TablePager } from "@/shared/ui-components/data/TablePager";
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
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { useInboxConversations } from "../hooks/useInbox";
import type { InboxConversationRow } from "../schemas";

// One request covers a recruiter's submissions in practice; the note below
// surfaces the rare case where more exist than we fetched.
const FETCH_LIMIT = 200;

/** Distinct, alphabetically-sorted values of one field across the rows. */
function distinct(
  rows: InboxConversationRow[],
  pick: (row: InboxConversationRow) => string,
): { value: string; label: string }[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = pick(row);
    if (value) seen.add(value);
  }
  return [...seen]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

function JobLink({ jobId, title }: { jobId: string; title: string }) {
  return (
    <Link
      href={`/jobs/${jobId}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/5"
    >
      <Briefcase className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{title}</span>
    </Link>
  );
}

function OpenConversationLink({ candidateId }: { candidateId: string }) {
  return (
    <Link
      href={`/recruiter/inbox/${candidateId}`}
      className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
    >
      Open conversation
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function StatusPill({ row }: { row: InboxConversationRow }) {
  return (
    <StatusBadge
      label={CANDIDATE_STATUS_LABELS[row.status]}
      className={CANDIDATE_STATUS_STYLES[row.status]}
    />
  );
}

/**
 * Every candidate this recruiter has submitted, across all jobs — one row per
 * submission. Filterable by candidate name (search), company and job title;
 * the job title links to that job. Filtering and paging are client-side over
 * the recruiter's full conversation list, so the company/job dropdowns always
 * reflect the whole set rather than the current page.
 */
export function SubmissionsTable() {
  const { data, isPending, isError, refetch } = useInboxConversations(
    "recruiter",
    { page: 1, limit: FETCH_LIMIT },
  );

  const [qInput, setQInput] = useState("");
  const q = useDebouncedValue(qInput.trim(), 250);
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Any change to the filters or page size starts back on page 1.
  useEffect(() => {
    setPage(1);
  }, [q, company, jobTitle, limit]);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const companyOptions = useMemo(
    () => distinct(rows, (row) => row.counterpartyName),
    [rows],
  );
  const jobOptions = useMemo(
    () => distinct(rows, (row) => row.jobTitle),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter(
      (row) =>
        (!needle || row.candidateName.toLowerCase().includes(needle)) &&
        (!company || row.counterpartyName === company) &&
        (!jobTitle || row.jobTitle === jobTitle),
    );
  }, [rows, q, company, jobTitle]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageRows = filtered.slice((page - 1) * limit, page * limit);
  const submittedOf = (row: InboxConversationRow): Date =>
    row.submittedAt ?? row.lastActivityAt;

  const toolbar = (
    <div className={TABLE_TOOLBAR}>
      <div className="flex-1">
        <ListToolbar
          query={qInput}
          onQueryChange={setQInput}
          placeholder="Search by candidate name…"
          filter={{
            value: company,
            onChange: setCompany,
            allLabel: "All companies",
            options: companyOptions,
          }}
          extraFilter={{
            value: jobTitle,
            onChange: setJobTitle,
            allLabel: "All jobs",
            options: jobOptions,
          }}
        />
      </div>
    </div>
  );

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {toolbar}
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
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Users className="h-6 w-6" />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            {rows.length === 0
              ? "No submissions yet"
              : "No submissions match these filters"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {rows.length === 0
              ? "Candidates you submit to jobs appear here, each with its own conversation."
              : "Try clearing the company or job filter, or a different search."}
          </p>
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <th className={TABLE_TH}>Candidate</th>
                  <th className={TABLE_TH}>Company</th>
                  <th className={TABLE_TH}>Job title</th>
                  <th className={TABLE_TH}>Submitted</th>
                  <th className={TABLE_TH}>Status</th>
                  <th className={TABLE_TH} />
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {pageRows.map((row) => (
                  <tr key={row.candidateId} className={TABLE_ROW}>
                    <td className={`${TABLE_TD} font-semibold text-navy`}>
                      <span className="flex items-center gap-2">
                        {row.candidateName}
                        <UnreadBadge count={row.unreadMessages} />
                      </span>
                    </td>
                    <td className={`${TABLE_TD} text-navy`}>
                      {row.counterpartyName}
                    </td>
                    <td className={TABLE_TD}>
                      <JobLink jobId={row.jobId} title={row.jobTitle} />
                    </td>
                    <td
                      className={`${TABLE_TD} whitespace-nowrap tabular-nums text-brand-gray`}
                    >
                      {formatDate(submittedOf(row))}
                    </td>
                    <td className={TABLE_TD}>
                      <StatusPill row={row} />
                    </td>
                    <td className={`${TABLE_TD} text-right`}>
                      <OpenConversationLink candidateId={row.candidateId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MobileRecordList className="sm:hidden">
            {pageRows.map((row) => (
              <MobileRecordCard
                key={row.candidateId}
                title={row.candidateName}
                subtitle={row.counterpartyName}
                trailing={
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusPill row={row} />
                    <UnreadBadge count={row.unreadMessages} />
                  </div>
                }
                fields={[
                  {
                    label: "Job",
                    value: <JobLink jobId={row.jobId} title={row.jobTitle} />,
                  },
                  { label: "Submitted", value: formatDate(submittedOf(row)) },
                ]}
                actions={<OpenConversationLink candidateId={row.candidateId} />}
              />
            ))}
          </MobileRecordList>
          <TablePager
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={limit}
            onPage={setPage}
            onPageSize={setLimit}
          />
          {data && data.meta.total > rows.length ? (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Showing your {rows.length} most recent submissions of{" "}
              {data.meta.total}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
