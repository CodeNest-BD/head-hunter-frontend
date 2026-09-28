"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Search,
  Users,
} from "lucide-react";

import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
} from "@/features/candidates/schemas";
import { CandidateQuickView } from "@/features/candidates/components/CandidateQuickView";
import {
  ColumnFilter,
  FilterableHead,
} from "@/shared/ui-components/data/ColumnFilter";
import { CANDIDATE_STATUS_TONES } from "@/features/candidates/components/statusStyles";
import { jobPath } from "@/features/jobs/utils/jobPath";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate, formatRelativeDay } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { RefChip } from "@/shared/ui-components/badges/RefChip";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL_MAIN,
  TABLE_CELL_SUB,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_ROW_UNREAD,
  TABLE_TD_RAIL,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TD_STACKED,
  TABLE_TH,
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { useInboxConversations } from "../hooks/useInbox";
import type { InboxConversationRow } from "../schemas";

// The inbox-conversations endpoint caps `limit` at 100; one request covers a
// recruiter's submissions in practice, and the note below surfaces the rare
// case where more exist than we fetched.
const FETCH_LIMIT = 100;

interface Option {
  value: string;
  label: string;
}

type Sort = "newest" | "oldest" | "fee-desc" | "fee-asc";
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "fee-desc", label: "Highest fee" },
  { value: "fee-asc", label: "Lowest fee" },
];

/** Narrows the select's plain string back to a sort this table understands. */
const isSort = (value: string): value is Sort =>
  SORT_OPTIONS.some((option) => option.value === value);

/** Distinct values of one field across the rows, as {value,label} options. */
function distinct(
  rows: InboxConversationRow[],
  pick: (row: InboxConversationRow) => string,
): Option[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = pick(row);
    if (value) seen.add(value);
  }
  return [...seen]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

/**
 * The per-column header control: a filter icon that opens a searchable,
 * multi-select value list. Empty selection means "all". The icon reads as
 * active once anything is picked, so a narrowed column is never silent.
 */
function JobLink({ jobId, title }: { jobId: string; title: string }) {
  return (
    <Link
      href={jobPath({ id: jobId, title })}
      className="inline-flex min-w-0 max-w-full"
    >
      <RefChip className="transition-colors hover:bg-info-line">
        <Briefcase aria-hidden="true" />
        <span className="truncate">{title}</span>
      </RefChip>
    </Link>
  );
}

function OpenConversationLink({ candidateId }: { candidateId: string }) {
  return (
    <Link
      href={`/recruiter/inbox/${candidateId}`}
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sub font-[550] text-blue-ink underline-offset-2 transition-colors hover:underline"
    >
      Open conversation
      <ArrowRight aria-hidden="true" className="size-3.5" />
    </Link>
  );
}

/** The Thread column: a button into the candidate's conversation. */
function ThreadCell({ row }: { row: InboxConversationRow }) {
  return (
    <Link
      href={`/recruiter/inbox/${row.candidateId}`}
      aria-label="Open conversation"
      className="inline-flex size-7 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
    >
      <ArrowRight aria-hidden="true" className="size-[15px]" />
    </Link>
  );
}

/** A pill with a leading dot in the stage's own hue. */
function StatusPill({ row }: { row: InboxConversationRow }) {
  return (
    <StatusBadge
      label={CANDIDATE_STATUS_LABELS[row.status]}
      tone={CANDIDATE_STATUS_TONES[row.status]}
    />
  );
}

/**
 * Every candidate this recruiter has submitted, across all jobs — one row per
 * submission. One search box spans candidate, company and job; each column
 * header carries its own searchable, multi-select filter. Filtering, sorting
 * and paging are client-side over the recruiter's full conversation list, so
 * the column filters always reflect the whole set, not the current page.
 *
 * Scoped to one job via `jobId`, it's the same table a recruiter sees on a
 * job's own candidates page — identical look, just that job's rows.
 */
export function SubmissionsTable({
  jobId,
  emptyAction,
}: {
  /** Limit rows to a single job (the per-job candidates view). */
  jobId?: string;
  /** Offered inside the empty state, where the reader is already looking. */
  emptyAction?: ReactNode;
} = {}) {
  const { data, isPending, isError, refetch } = useInboxConversations(
    "recruiter",
    { page: 1, limit: FETCH_LIMIT, jobId },
  );

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim().toLowerCase(), 250);
  const [candidateSel, setCandidateSel] = useState<Set<string>>(new Set());
  const [companySel, setCompanySel] = useState<Set<string>>(new Set());
  const [jobSel, setJobSel] = useState<Set<string>>(new Set());
  const [statusSel, setStatusSel] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const fetched = useMemo(() => data?.data ?? [], [data]);
  const rows = useMemo(
    () => (jobId ? fetched.filter((row) => row.jobId === jobId) : fetched),
    [fetched, jobId],
  );

  const candidateOptions = useMemo(
    () => distinct(rows, (row) => row.candidateName),
    [rows],
  );
  const companyOptions = useMemo(
    () => distinct(rows, (row) => row.counterpartyName),
    [rows],
  );
  const jobOptions = useMemo(
    () => distinct(rows, (row) => row.jobTitle),
    [rows],
  );
  const statusOptions = useMemo<Option[]>(() => {
    const present = new Set(rows.map((row) => row.status));
    return CANDIDATE_STATUSES.filter((status) => present.has(status)).map(
      (status) => ({ value: status, label: CANDIDATE_STATUS_LABELS[status] }),
    );
  }, [rows]);

  const submittedOf = (row: InboxConversationRow): Date =>
    row.submittedAt ?? row.lastActivityAt;

  const visible = useMemo(() => {
    const matches = rows.filter(
      (row) =>
        (!search ||
          row.candidateName.toLowerCase().includes(search) ||
          row.counterpartyName.toLowerCase().includes(search) ||
          row.jobTitle.toLowerCase().includes(search)) &&
        (candidateSel.size === 0 || candidateSel.has(row.candidateName)) &&
        (companySel.size === 0 || companySel.has(row.counterpartyName)) &&
        (jobSel.size === 0 || jobSel.has(row.jobTitle)) &&
        (statusSel.size === 0 || statusSel.has(row.status)),
    );
    return matches.sort((a, b) => {
      if (sort === "fee-desc" || sort === "fee-asc") {
        const fee = (a.recruiterFeeMinor ?? 0) - (b.recruiterFeeMinor ?? 0);
        return sort === "fee-desc" ? -fee : fee;
      }
      const diff = submittedOf(a).getTime() - submittedOf(b).getTime();
      return sort === "newest" ? -diff : diff;
    });
  }, [rows, search, candidateSel, companySel, jobSel, statusSel, sort]);

  // Any change to the search, filters, sort or page size starts on page 1.
  useEffect(() => {
    setPage(1);
  }, [search, candidateSel, companySel, jobSel, statusSel, sort, limit]);

  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageRows = visible.slice((page - 1) * limit, page * limit);

  const searchBox = (
    <div className={TABLE_TOOLBAR}>
      <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-[11px] top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
        />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by candidate, company or job title…"
          className="pl-8 text-sub"
        />
      </div>
      <Select
        value={sort}
        onValueChange={(next) => {
          if (isSort(next)) setSort(next);
        }}
      >
        <SelectTrigger className="w-full sm:w-[168px]" aria-label="Sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {searchBox}
        <Alert tone="bad" icon={AlertCircle}>
          <div className="flex flex-col items-start gap-2.5">
            <span className="font-[650]">Could not load your submissions.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {searchBox}

      {isPending ? (
        <TableSkeleton />
      ) : total === 0 ? (
        <div className={TABLE_CARD}>
          <EmptyState
            icon={Users}
            title={
              rows.length === 0
                ? "No submissions yet"
                : "No submissions match these filters"
            }
            description={
              rows.length === 0
                ? "Candidates you submit to jobs appear here, each with its own conversation."
                : "Try clearing a column filter or a different search."
            }
            action={rows.length === 0 ? emptyAction : null}
          />
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <FilterableHead label="Candidate">
                    <ColumnFilter
                      multiple
                      label="Candidate"
                      options={candidateOptions}
                      value={candidateSel}
                      onChange={setCandidateSel}
                    />
                  </FilterableHead>
                  <FilterableHead label="Company">
                    <ColumnFilter
                      multiple
                      label="Company"
                      options={companyOptions}
                      value={companySel}
                      onChange={setCompanySel}
                    />
                  </FilterableHead>
                  <FilterableHead label="Job title">
                    <ColumnFilter
                      multiple
                      label="Job"
                      options={jobOptions}
                      value={jobSel}
                      onChange={setJobSel}
                    />
                  </FilterableHead>
                  <th className={TABLE_TH}>Submitted</th>
                  <FilterableHead label="Status">
                    <ColumnFilter
                      multiple
                      label="Status"
                      options={statusOptions}
                      value={statusSel}
                      onChange={setStatusSel}
                    />
                  </FilterableHead>
                  <th className={cn(TABLE_TH, "text-right")}>Recruiter fee</th>
                  <th className={cn(TABLE_TH, "text-right")}>Thread</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {pageRows.map((row) => (
                  <tr
                    key={row.candidateId}
                    className={cn(
                      TABLE_ROW,
                      row.unreadMessages > 0 && TABLE_ROW_UNREAD,
                    )}
                  >
                    <td
                      className={cn(
                        TABLE_TD,
                        row.unreadMessages > 0 && TABLE_TD_RAIL,
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar name={row.candidateName} size="sm" />
                        <span
                          className={cn(
                            "flex items-center gap-2",
                            TABLE_CELL_MAIN,
                          )}
                        >
                          {row.candidateName}
                          {row.unreadMessages > 0 && (
                            <span
                              className="size-[7px] rounded-full bg-blue"
                              aria-label="Unread messages"
                            />
                          )}
                          <CandidateQuickView
                            candidateId={row.candidateId}
                            name={row.candidateName}
                          />
                        </span>
                      </span>
                    </td>
                    <td className={`${TABLE_TD} text-ink-body`}>
                      {row.counterpartyName}
                    </td>
                    <td className={TABLE_TD}>
                      <JobLink jobId={row.jobId} title={row.jobTitle} />
                    </td>
                    <td className={cn(TABLE_TD_STACKED, "whitespace-nowrap")}>
                      <span className="block tabular-nums text-ink">
                        {formatDate(submittedOf(row))}
                      </span>
                      <span className={cn("block", TABLE_CELL_SUB)}>
                        {formatRelativeDay(submittedOf(row))}
                      </span>
                    </td>
                    <td className={TABLE_TD}>
                      <StatusPill row={row} />
                    </td>
                    <td
                      className={`${TABLE_TD} whitespace-nowrap text-right font-[650] tabular-nums text-ink`}
                    >
                      {row.recruiterFeeMinor != null
                        ? formatMinor(row.recruiterFeeMinor)
                        : "—"}
                    </td>
                    <td className={`${TABLE_TD} text-right`}>
                      <ThreadCell row={row} />
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
                    {row.unreadMessages > 0 && (
                      <span className="text-[11px] font-[550] text-blue-ink">
                        {row.unreadMessages} unread
                      </span>
                    )}
                  </div>
                }
                fields={[
                  {
                    label: "Job",
                    value: <JobLink jobId={row.jobId} title={row.jobTitle} />,
                  },
                  {
                    label: "Submitted",
                    value: `${formatDate(submittedOf(row))} · ${formatRelativeDay(submittedOf(row))}`,
                  },
                  {
                    label: "Recruiter fee",
                    value:
                      row.recruiterFeeMinor != null
                        ? formatMinor(row.recruiterFeeMinor)
                        : "—",
                  },
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
          {data && data.meta.total > fetched.length ? (
            <p className="border-t border-line px-4 py-2 text-meta text-ink-muted">
              Showing your {fetched.length} most recent submissions of{" "}
              {data.meta.total}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
