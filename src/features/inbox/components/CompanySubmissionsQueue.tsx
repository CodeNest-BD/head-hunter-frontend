"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Eye,
  FileText,
  Inbox,
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
import {
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { inboxThreadPath, jobPath, urlRef } from "@/shared/utils/entityPaths";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatTimeAgo, formatDateTime } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { RefChip } from "@/shared/ui-components/badges/RefChip";
import { PageHeader } from "@/shared/ui-components/brand";
import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import {
  TableFilterBar,
  type FilterBarOption,
} from "@/shared/ui-components/data/TableFilterBar";
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

const STATUS_OPTIONS: FilterBarOption[] = CANDIDATE_STATUSES.map((value) => ({
  value,
  label: QUEUE_STATUS_LABELS[value],
}));

const RECRUITER_OPTIONS: FilterBarOption[] = [
  { value: "rated", label: "Rated recruiters" },
  { value: "unrated", label: "Unrated recruiters" },
];

/**
 * Candidate carries the row's identity and its quick-view eye; Actions carries
 * the only link into the thread. Neither can be hidden.
 */
const COLUMNS: ColumnDef[] = [
  { key: "candidate", label: "Candidate", required: true },
  { key: "job", label: "Job" },
  { key: "recruiter", label: "Recruiter" },
  { key: "rating", label: "Rating" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", required: true },
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

const jobHref = (row: InboxSubmissionRow): string =>
  jobPath({ id: row.jobId, serialNumber: row.jobSerialNumber });

const threadHref = (row: InboxSubmissionRow): string =>
  inboxThreadPath("company", {
    id: row.candidateId,
    serialNumber: row.candidateSerialNumber,
  });

/** The job cell — a link to the job's detail page. */
function JobLink({ row }: { row: InboxSubmissionRow }) {
  return (
    <Link
      href={jobHref(row)}
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
 * conversation thread. Stat cards are read-only; every filter lives in the
 * bar above the table.
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
  // URL it arrived from. It holds the job's URL ref (serial, or the UUID on an
  // old link), which the submissions endpoint resolves itself.
  const [jobRef, setJobRef] = useState<string | null>(
    () => searchParams?.get("job") ?? null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [recruiterKind, setRecruiterKind] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SubmissionSort>("priority");
  const cols = useVisibleColumns("company.inbox.submissions.columns", COLUMNS);

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
    jobId: jobRef ?? undefined,
    status: statusFilter(status),
    recruiterKind: recruiterKindFilter(recruiterKind),
    sortBy,
  });

  const jobOptions = useMemo<FilterBarOption[]>(
    () =>
      (jobs.data?.data ?? []).map((job) => ({
        value: urlRef({ id: job.jobId, serialNumber: job.jobSerialNumber }),
        label:
          job.newCandidateCount > 0
            ? `${job.jobTitle} (${job.newCandidateCount} new)`
            : job.jobTitle,
      })),
    [jobs.data],
  );
  // An old `?job=<uuid>` link still scopes the list, but the options are keyed
  // by serial, so show it as the matching option rather than "All jobs".
  const legacyJob = jobs.data?.data.find((job) => job.jobId === jobRef);
  const selectedJob = legacyJob
    ? urlRef({ id: legacyJob.jobId, serialNumber: legacyJob.jobSerialNumber })
    : jobRef;

  const setFilter =
    (setter: (next: string | null) => void) => (next: string | null) => {
      setter(next);
      setPage(1);
    };
  const changeJob = setFilter(setJobRef);
  const changeStatus = setFilter(setStatus);
  const changeRecruiter = setFilter(setRecruiterKind);

  const hasFilters =
    q !== "" ||
    jobRef !== null ||
    status !== null ||
    recruiterKind !== null ||
    sortBy !== "priority";

  const resetFilters = () => {
    setQInput("");
    setQ("");
    setJobRef(null);
    setStatus(null);
    setRecruiterKind(null);
    setSortBy("priority");
    setPage(1);
  };

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

      <TableFilterBar
        filters={[
          {
            kind: "search",
            key: "q",
            label: "Search submissions",
            placeholder: "Search candidate, recruiter or job…",
            value: qInput,
            onChange: setQInput,
          },
          {
            kind: "select",
            key: "job",
            label: "Job",
            placeholder: "All jobs",
            options: jobOptions,
            value: selectedJob ?? "",
            onChange: (next) => changeJob(next === "" ? null : next),
            searchable: true,
            width: "190px",
          },
          {
            kind: "select",
            key: "status",
            label: "Status",
            placeholder: "All statuses",
            options: STATUS_OPTIONS,
            value: status ?? "",
            onChange: (next) => changeStatus(next === "" ? null : next),
          },
          {
            kind: "select",
            key: "recruiter",
            label: "Recruiter",
            placeholder: "All recruiters",
            options: RECRUITER_OPTIONS,
            value: recruiterKind ?? "",
            onChange: (next) => changeRecruiter(next === "" ? null : next),
            width: "180px",
          },
          {
            // The sort is not a filter, but it belongs with the controls that
            // decide what the table shows rather than floating above them.
            kind: "custom",
            key: "sort",
            active: sortBy !== "priority",
            render: () => (
              <NativeSelect
                aria-label="Sort submissions"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(sortValue(event.target.value));
                  setPage(1);
                }}
                className="w-full text-sub sm:w-56"
              >
                {SUBMISSION_SORTS.map((value) => (
                  <option key={value} value={value}>
                    Sort: {SUBMISSION_SORT_LABELS[value]}
                  </option>
                ))}
              </NativeSelect>
            ),
          },
        ]}
        columns={cols.columns}
        isColumnVisible={cols.isVisible}
        onToggleColumn={cols.toggle}
        onClearFilters={resetFilters}
      />

      <div className="text-sub tabular-nums text-ink-muted">
        {submissions.data
          ? `${submissions.data.meta.total.toLocaleString()} submission${
              submissions.data.meta.total === 1 ? "" : "s"
            } found`
          : "Loading submissions…"}
      </div>

      {submissions.isPending ? (
        <TableSkeleton
          rows={6}
          columns={cols.allKeys.filter(cols.isVisible).length}
        />
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
            action={
              hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Reset filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className={TABLE_CARD}>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className={TABLE_TH}>Candidate</th>
                    {cols.isVisible("job") && (
                      <th scope="col" className={TABLE_TH}>
                        Job
                      </th>
                    )}
                    {cols.isVisible("recruiter") && (
                      <th scope="col" className={TABLE_TH}>
                        Recruiter
                      </th>
                    )}
                    {cols.isVisible("rating") && (
                      <th className={TABLE_TH}>Rating</th>
                    )}
                    {cols.isVisible("submitted") && (
                      <th className={TABLE_TH}>Submitted</th>
                    )}
                    {cols.isVisible("status") && (
                      <th scope="col" className={TABLE_TH}>
                        Status
                      </th>
                    )}
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
                        onClick={() => router.push(threadHref(row))}
                      >
                        <td
                          className={cn(TABLE_TD, attention && TABLE_TD_RAIL)}
                        >
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
                        {cols.isVisible("job") && (
                          <td className={TABLE_TD}>
                            <JobLink row={row} />
                          </td>
                        )}
                        {cols.isVisible("recruiter") && (
                          <td className={TABLE_TD_STACKED}>
                            <RecruiterCell row={row} />
                          </td>
                        )}
                        {cols.isVisible("rating") && (
                          <td className={TABLE_TD}>
                            <RatingStars
                              value={row.recruiter?.ratingAvg ?? null}
                              count={row.recruiter?.ratingCount}
                            />
                          </td>
                        )}
                        {cols.isVisible("submitted") && (
                          <td className={TABLE_TD}>
                            <span
                              className="whitespace-nowrap tabular-nums text-ink-muted"
                              title={formatDateTime(row.submittedAt)}
                            >
                              {formatTimeAgo(row.submittedAt)}
                            </span>
                          </td>
                        )}
                        {cols.isVisible("status") && (
                          <td className={TABLE_TD}>
                            <StatusBadge
                              label={QUEUE_STATUS_LABELS[row.status]}
                              tone={CANDIDATE_STATUS_TONES[row.status]}
                            />
                          </td>
                        )}
                        <td className={cn(TABLE_TD, "text-right")}>
                          <Link
                            href={threadHref(row)}
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
                  href={threadHref(row)}
                  trailing={
                    <StatusBadge
                      label={QUEUE_STATUS_LABELS[row.status]}
                      tone={CANDIDATE_STATUS_TONES[row.status]}
                    />
                  }
                  className={cn(
                    candidateNeedsAttention(row) && TABLE_ROW_UNREAD,
                  )}
                  fields={[
                    {
                      label: "Job",
                      value: (
                        <Link
                          href={jobHref(row)}
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
                    {
                      label: "Submitted",
                      value: formatTimeAgo(row.submittedAt),
                    },
                  ]}
                  actions={
                    <Link
                      href={threadHref(row)}
                      className="text-sub font-[550] text-blue-ink underline-offset-2 hover:underline"
                    >
                      View conversation
                    </Link>
                  }
                />
              ))}
            </MobileRecordList>
          </div>
          <TablePager
            page={page}
            totalPages={submissions.data.meta.totalPages}
            total={submissions.data.meta.total}
            onPage={setPage}
            pageSize={PAGE_SIZE}
          />
        </>
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
