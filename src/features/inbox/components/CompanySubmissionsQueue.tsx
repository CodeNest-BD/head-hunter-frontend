"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Check,
  Eye,
  FileText,
  Inbox,
  ListFilter,
  Search,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import {
  CANDIDATE_STATUSES,
  type CandidateStatus,
} from "@/features/candidates/schemas";
import { CandidateQuickView } from "@/features/candidates/components/CandidateQuickView";
import { CANDIDATE_STATUS_TONES } from "@/features/candidates/components/statusStyles";
import { jobPath } from "@/features/jobs/utils/jobPath";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatTimeAgo, formatDateTime } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { RefChip } from "@/shared/ui-components/badges/RefChip";
import { PageHeader } from "@/shared/ui-components/brand";
import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
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
import {
  useCompanySubmissionStats,
  useCompanySubmissions,
  useInboxJobs,
} from "../hooks/useInbox";
import {
  SUBMISSION_SORTS,
  SUBMISSION_SORT_LABELS,
  candidateNeedsAttention,
  type InboxSubmissionRow,
  type InboxSubmissionStats,
  type SubmissionRecruiterKind,
  type SubmissionSort,
} from "../schemas";

const PAGE_SIZE = 25;

/**
 * The queue speaks the requirement doc's language: an unreviewed submission
 * is "New". Every other status keeps its product name.
 */
const QUEUE_STATUS_LABELS: Record<CandidateStatus, string> = {
  submitted: "New",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  passed: "Passed",
};

interface FilterOption {
  value: string;
  label: string;
}

const STATUS_OPTIONS: FilterOption[] = CANDIDATE_STATUSES.map((value) => ({
  value,
  label: QUEUE_STATUS_LABELS[value],
}));

const RECRUITER_OPTIONS: FilterOption[] = [
  { value: "rated", label: "Rated recruiters" },
  { value: "unrated", label: "Unrated recruiters" },
];

interface StatCardDef {
  key: CandidateStatus | "total";
  label: string;
  icon: LucideIcon;
  value: (stats: InboxSubmissionStats) => number;
}

const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "Total Submissions",
    icon: Inbox,
    value: (s) => s.total,
  },
  { key: "submitted", label: "New", icon: Sparkles, value: (s) => s.submitted },
  {
    key: "reviewing",
    label: "Reviewing",
    icon: Eye,
    value: (s) => s.reviewing,
  },
  {
    key: "interviewing",
    label: "Interviewing",
    icon: CalendarClock,
    value: (s) => s.interviewing,
  },
  { key: "offered", label: "Offered", icon: FileText, value: (s) => s.offered },
  { key: "hired", label: "Hired", icon: UserCheck, value: (s) => s.hired },
  { key: "passed", label: "Passed", icon: BadgeCheck, value: (s) => s.passed },
];

/**
 * A column-header filter: the ListFilter icon opens a single-select value list
 * (searchable when there are many options, e.g. jobs). Empty selection means
 * "all"; the icon reads as active once a value is picked. Server-backed —
 * selecting sets a query param, so it filters the whole result set, not just
 * the current page. Mirrors the recruiter submissions table's column filters.
 */
function HeaderFilter({
  label,
  options,
  value,
  onChange,
  searchable = false,
}: {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (next: string | null) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const active = value !== null;
  const shown = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  const select = (next: string | null) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filter by ${label}`}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-xs transition-colors",
            active
              ? "bg-tint text-blue"
              : "text-ink-faint hover:bg-surface-sunken hover:text-ink",
          )}
        >
          <ListFilter className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        {searchable && (
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
              />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="h-7.5 w-full rounded-sm border border-line-strong bg-surface pl-7 pr-2 text-meta text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-blue focus-visible:shadow-focus"
              />
            </div>
          </div>
        )}
        <div className="max-h-56 overflow-y-auto p-1">
          {shown.length === 0 ? (
            <p className="px-2 py-3 text-center text-meta text-ink-muted">
              No matches
            </p>
          ) : (
            shown.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => select(option.value)}
                className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-meta text-ink-body transition-colors hover:bg-surface-sub"
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {value === option.value && (
                    <Check className="size-3.5 text-blue" />
                  )}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
        {active && (
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={() => select(null)}
              className="w-full rounded-xs px-2 py-1.5 text-left text-meta font-[550] text-blue-ink transition-colors hover:bg-surface-sub"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** A header cell carrying its label and an inline column filter. */
function FilterableHead({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th className={cn(TABLE_TH, className)}>
      <span className="inline-flex items-center gap-1.5">
        {label}
        {children}
      </span>
    </th>
  );
}

function RecruiterCell({ row }: { row: InboxSubmissionRow }) {
  if (!row.recruiter) {
    return <span className="text-ink-faint">—</span>;
  }
  return (
    <div className="min-w-0">
      <p className="truncate font-[550] text-ink">
        {row.recruiter.firstName} {row.recruiter.lastName}
      </p>
      <p className={cn(TABLE_CELL_SUB, "tabular-nums")}>
        {row.recruiter.yearsExperience === null
          ? "Experience not set"
          : `${row.recruiter.yearsExperience} yrs experience`}
      </p>
    </div>
  );
}

/** The job cell — a link to the job's detail page. */
function JobLink({ row }: { row: InboxSubmissionRow }) {
  return (
    <Link
      href={jobPath({ id: row.jobId, title: row.jobTitle })}
      onClick={(event) => event.stopPropagation()}
      className="inline-flex min-w-0 max-w-[220px]"
    >
      <RefChip className="transition-colors hover:bg-info-line">
        <Briefcase aria-hidden="true" />
        <span className="truncate">{row.jobTitle}</span>
      </RefChip>
    </Link>
  );
}

/**
 * The company inbox as the requirements doc frames it — a Job-based Candidate
 * Submission Queue. Job scopes the list, Status filters it, recruiter Rating
 * sets the default priority and submission Time breaks ties; a row opens its
 * conversation thread. Stat cards are read-only; filtering lives in the
 * column headers (like the recruiter submissions table).
 */
export function CompanySubmissionsQueue() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  // `?job=` scopes the queue to one job — how a job's candidate count opens it.
  // Read once as the initial value rather than synced: once here, the Job
  // column filter owns the choice, so clearing it must not be undone by the
  // URL it arrived from.
  const [jobId, setJobId] = useState<string | null>(() =>
    searchParams.get("job"),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [recruiterKind, setRecruiterKind] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SubmissionSort>("priority");

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = qInput.trim();
      // Only react when the effective query changes — typing then deleting a
      // trailing space must not silently bounce the user to page 1.
      setQ((current) => {
        if (current !== trimmed) setPage(1);
        return trimmed;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  const stats = useCompanySubmissionStats();
  // The Job filter needs every job with its new-submission count; 100 covers a
  // company's open listings comfortably (the endpoint caps larger asks anyway).
  const jobs = useInboxJobs("company", { page: 1, limit: 100 });
  const submissions = useCompanySubmissions({
    page,
    limit: PAGE_SIZE,
    q: q || undefined,
    jobId: jobId ?? undefined,
    status: statusFilter(status),
    recruiterKind: recruiterKindFilter(recruiterKind),
    sortBy,
  });

  const jobOptions = useMemo<FilterOption[]>(
    () =>
      (jobs.data?.data ?? []).map((job) => ({
        value: job.jobId,
        label:
          job.newCandidateCount > 0
            ? `${job.jobTitle} (${job.newCandidateCount} new)`
            : job.jobTitle,
      })),
    [jobs.data],
  );

  const setFilter =
    (setter: (next: string | null) => void) => (next: string | null) => {
      setter(next);
      setPage(1);
    };
  const changeJob = setFilter(setJobId);
  const changeStatus = setFilter(setStatus);
  const changeRecruiter = setFilter(setRecruiterKind);

  const hasFilters =
    q !== "" ||
    jobId !== null ||
    status !== null ||
    recruiterKind !== null ||
    sortBy !== "priority";

  const resetFilters = () => {
    setQInput("");
    setQ("");
    setJobId(null);
    setStatus(null);
    setRecruiterKind(null);
    setSortBy("priority");
    setPage(1);
  };

  const openThread = (candidateId: string) =>
    router.push(`/company/inbox/${candidateId}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Candidate Submissions"
        subtitle="Review and manage candidate submissions from recruiters."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {STAT_CARDS.map(({ key, label, icon, value }) => (
          <StatCard
            key={key}
            label={label}
            icon={icon}
            value={stats.data ? value(stats.data) : "—"}
          />
        ))}
      </div>

      <div className={TABLE_TOOLBAR}>
        <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-[11px] top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            placeholder="Search candidate, recruiter or job…"
            className="pl-8 text-sub"
            aria-label="Search submissions"
          />
        </div>
        <NativeSelect
          aria-label="Sort submissions"
          value={sortBy}
          onChange={(event) => {
            setSortBy(sortValue(event.target.value));
            setPage(1);
          }}
          className="text-sub sm:w-64"
        >
          {SUBMISSION_SORTS.map((value) => (
            <option key={value} value={value}>
              Sort: {SUBMISSION_SORT_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex items-center justify-between gap-3 text-sub">
        <span className="tabular-nums text-ink-muted">
          {submissions.data
            ? `${submissions.data.meta.total.toLocaleString()} submission${
                submissions.data.meta.total === 1 ? "" : "s"
              } found`
            : "Loading submissions…"}
        </span>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            Reset filters
          </Button>
        )}
      </div>

      {submissions.isPending ? (
        <TableSkeleton rows={6} />
      ) : submissions.isError ? (
        <ErrorRetryCallout
          message="Could not load your submissions."
          onRetry={() => void submissions.refetch()}
        />
      ) : submissions.data.data.length === 0 ? (
        <div className={TABLE_CARD}>
          <EmptyState
            icon={Inbox}
            title="No submissions found"
            description={
              hasFilters
                ? "Try a different search or filter."
                : "Recruiters' candidates will land here as they come in."
            }
          />
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Candidate</th>
                  <FilterableHead label="Job">
                    <HeaderFilter
                      label="Job"
                      options={jobOptions}
                      value={jobId}
                      onChange={changeJob}
                      searchable
                    />
                  </FilterableHead>
                  <FilterableHead label="Recruiter">
                    <HeaderFilter
                      label="Recruiter"
                      options={RECRUITER_OPTIONS}
                      value={recruiterKind}
                      onChange={changeRecruiter}
                    />
                  </FilterableHead>
                  <th className={TABLE_TH}>Rating</th>
                  <th className={TABLE_TH}>Submitted</th>
                  <FilterableHead label="Status">
                    <HeaderFilter
                      label="Status"
                      options={STATUS_OPTIONS}
                      value={status}
                      onChange={changeStatus}
                    />
                  </FilterableHead>
                  <th className={cn(TABLE_TH, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {submissions.data.data.map((row) => {
                  const attention = candidateNeedsAttention(row);
                  return (
                    <tr
                      key={row.candidateId}
                      className={cn(
                        TABLE_ROW,
                        "cursor-pointer",
                        attention && TABLE_ROW_UNREAD,
                      )}
                      onClick={() => openThread(row.candidateId)}
                    >
                      <td className={cn(TABLE_TD, attention && TABLE_TD_RAIL)}>
                        <span className="flex items-center gap-2">
                          {attention && (
                            <span
                              className="size-[7px] shrink-0 rounded-full bg-blue"
                              aria-label="Has unseen activity"
                            />
                          )}
                          <Avatar name={row.candidateName} size="sm" />
                          <span className={TABLE_CELL_MAIN}>
                            {row.candidateName}
                          </span>
                          <CandidateQuickView
                            candidateId={row.candidateId}
                            name={row.candidateName}
                          />
                        </span>
                      </td>
                      <td className={TABLE_TD}>
                        <JobLink row={row} />
                      </td>
                      <td className={TABLE_TD_STACKED}>
                        <RecruiterCell row={row} />
                      </td>
                      <td className={TABLE_TD}>
                        <RatingStars
                          value={row.recruiter?.ratingAvg ?? null}
                          count={row.recruiter?.ratingCount}
                        />
                      </td>
                      <td className={TABLE_TD}>
                        <span
                          className="whitespace-nowrap tabular-nums text-ink-muted"
                          title={formatDateTime(row.submittedAt)}
                        >
                          {formatTimeAgo(row.submittedAt)}
                        </span>
                      </td>
                      <td className={TABLE_TD}>
                        <StatusBadge
                          label={QUEUE_STATUS_LABELS[row.status]}
                          tone={CANDIDATE_STATUS_TONES[row.status]}
                        />
                      </td>
                      <td className={cn(TABLE_TD, "text-right")}>
                        <Link
                          href={`/company/inbox/${row.candidateId}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex h-7.5 items-center rounded-xs border border-line-strong bg-surface px-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-sub"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MobileRecordList className="sm:hidden">
            {submissions.data.data.map((row) => (
              <MobileRecordCard
                key={row.candidateId}
                title={row.candidateName}
                subtitle={row.jobTitle}
                href={`/company/inbox/${row.candidateId}`}
                trailing={
                  <StatusBadge
                    label={QUEUE_STATUS_LABELS[row.status]}
                    tone={CANDIDATE_STATUS_TONES[row.status]}
                  />
                }
                className={cn(candidateNeedsAttention(row) && TABLE_ROW_UNREAD)}
                fields={[
                  {
                    label: "Job",
                    value: (
                      <Link
                        href={jobPath({ id: row.jobId, title: row.jobTitle })}
                        className="font-[550] text-blue-ink underline-offset-2 hover:underline"
                      >
                        {row.jobTitle}
                      </Link>
                    ),
                  },
                  {
                    label: "Recruiter",
                    value: row.recruiter
                      ? `${row.recruiter.firstName} ${row.recruiter.lastName}`
                      : "—",
                  },
                  {
                    label: "Rating",
                    value: (
                      <RatingStars
                        value={row.recruiter?.ratingAvg ?? null}
                        count={row.recruiter?.ratingCount}
                        size="sm"
                      />
                    ),
                  },
                  { label: "Submitted", value: formatTimeAgo(row.submittedAt) },
                ]}
                actions={
                  <Link
                    href={`/company/inbox/${row.candidateId}`}
                    className="text-sub font-[550] text-blue-ink underline-offset-2 hover:underline"
                  >
                    View conversation
                  </Link>
                }
              />
            ))}
          </MobileRecordList>
          <TablePager
            page={page}
            totalPages={submissions.data.meta.totalPages}
            total={submissions.data.meta.total}
            onPage={setPage}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}

/** Narrow a filter's free string back into the typed query params. */
function statusFilter(value: string | null): CandidateStatus | undefined {
  return CANDIDATE_STATUSES.find((status) => status === value);
}

function recruiterKindFilter(
  value: string | null,
): SubmissionRecruiterKind | undefined {
  return value === "rated" || value === "unrated" ? value : undefined;
}

function sortValue(value: string): SubmissionSort {
  return SUBMISSION_SORTS.find((sort) => sort === value) ?? "priority";
}
