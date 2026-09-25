"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  ListFilter,
  Search,
  Users,
} from "lucide-react";

import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
} from "@/features/candidates/schemas";
import { CANDIDATE_STATUS_STYLES } from "@/features/candidates/components/statusStyles";
import { jobPath } from "@/features/jobs/utils/jobPath";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate, formatRelativeDay } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
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
  TABLE_EL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
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

const AVATAR_PALETTE = [
  "bg-[#E8EDFB] text-[#3F5BA9]",
  "bg-[#FBF1DC] text-[#8A6D3B]",
  "bg-[#E7F0E9] text-[#3F7A5A]",
  "bg-[#F2E9F3] text-[#7A4F86]",
  "bg-[#FBE9E6] text-[#9B4A3F]",
];
function avatarTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The per-column header control: a filter icon that opens a searchable,
 * multi-select value list. Empty selection means "all". The icon reads as
 * active once anything is picked, so a narrowed column is never silent.
 */
function ColumnFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [search, setSearch] = useState("");
  const active = selected.size > 0;
  const shown = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const toggle = (value: string): void => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filter by ${label}`}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground/50 hover:text-foreground",
          )}
        >
          <ListFilter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-8 w-full rounded-md border border-input bg-card pl-7 pr-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {shown.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              No matches
            </p>
          ) : (
            shown.map((option) => {
              const checked = selected.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
        {active && (
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="w-full rounded-sm px-2 py-1.5 text-left text-xs font-medium text-primary transition-colors hover:bg-secondary"
            >
              Clear ({selected.size})
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** A column header cell with its label and an inline filter control. */
function FilterableHead({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <th className={TABLE_TH}>
      <span className="inline-flex items-center gap-1.5">
        {label}
        {children}
      </span>
    </th>
  );
}

function JobLink({ jobId, title }: { jobId: string; title: string }) {
  return (
    <Link
      href={jobPath({ id: jobId, title })}
      className="inline-flex max-w-full items-center gap-1 rounded-[5px] border border-[#D7E0EF] bg-[#F1F5FC] px-1.5 py-0.5 text-[12px] font-medium text-[#24457A] transition-colors hover:bg-[#E7EEFA]"
    >
      <Briefcase className="h-3 w-3 shrink-0" />
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

/** The Thread column: a button into the candidate's conversation. */
function ThreadCell({ row }: { row: InboxConversationRow }) {
  return (
    <Link
      href={`/recruiter/inbox/${row.candidateId}`}
      aria-label="Open conversation"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/** A pill with a leading dot in the stage's own hue (`bg-current`). */
function StatusPill({ row }: { row: InboxConversationRow }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        CANDIDATE_STATUS_STYLES[row.status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {CANDIDATE_STATUS_LABELS[row.status]}
    </span>
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[240px] max-w-[480px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by candidate, company or job title…"
          className="h-11 rounded-lg bg-card pl-9"
        />
      </div>
      <Select value={sort} onValueChange={(next) => setSort(next as Sort)}>
        <SelectTrigger
          className="h-11 w-[168px] rounded-lg bg-card"
          aria-label="Sort"
        >
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
      {searchBox}

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
              : "Try clearing a column filter or a different search."}
          </p>
          {rows.length === 0 ? emptyAction : null}
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <FilterableHead label="Candidate">
                    <ColumnFilter
                      label="Candidate"
                      options={candidateOptions}
                      selected={candidateSel}
                      onChange={setCandidateSel}
                    />
                  </FilterableHead>
                  <FilterableHead label="Company">
                    <ColumnFilter
                      label="Company"
                      options={companyOptions}
                      selected={companySel}
                      onChange={setCompanySel}
                    />
                  </FilterableHead>
                  <FilterableHead label="Job title">
                    <ColumnFilter
                      label="Job"
                      options={jobOptions}
                      selected={jobSel}
                      onChange={setJobSel}
                    />
                  </FilterableHead>
                  <th className={TABLE_TH}>Submitted</th>
                  <FilterableHead label="Status">
                    <ColumnFilter
                      label="Status"
                      options={statusOptions}
                      selected={statusSel}
                      onChange={setStatusSel}
                    />
                  </FilterableHead>
                  <th className={cn(TABLE_TH, "text-right")}>Recruiter fee</th>
                  <th className={cn(TABLE_TH, "text-right")}>Thread</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {pageRows.map((row) => (
                  <tr key={row.candidateId} className={TABLE_ROW}>
                    <td className={TABLE_TD}>
                      <span className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold",
                            avatarTint(row.candidateName),
                          )}
                        >
                          {initials(row.candidateName)}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-navy">
                          {row.candidateName}
                          {row.unreadMessages > 0 && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                              aria-label="Unread messages"
                            />
                          )}
                        </span>
                      </span>
                    </td>
                    <td className={`${TABLE_TD} text-navy`}>
                      {row.counterpartyName}
                    </td>
                    <td className={TABLE_TD}>
                      <JobLink jobId={row.jobId} title={row.jobTitle} />
                    </td>
                    <td className={`${TABLE_TD} whitespace-nowrap`}>
                      <span className="block tabular-nums text-navy">
                        {formatDate(submittedOf(row))}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatRelativeDay(submittedOf(row))}
                      </span>
                    </td>
                    <td className={TABLE_TD}>
                      <StatusPill row={row} />
                    </td>
                    <td
                      className={`${TABLE_TD} whitespace-nowrap text-right tabular-nums font-medium text-navy`}
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
                      <span className="text-[11px] font-medium text-primary">
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
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Showing your {fetched.length} most recent submissions of{" "}
              {data.meta.total}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
