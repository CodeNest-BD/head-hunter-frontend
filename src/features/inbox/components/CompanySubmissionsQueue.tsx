"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  Eye,
  FileText,
  Inbox,
  Search,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import {
  CANDIDATE_STATUSES,
  type CandidateStatus,
} from "@/features/candidates/schemas";
import { CANDIDATE_STATUS_STYLES } from "@/features/candidates/components/statusStyles";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatTimeAgo, formatDateTime } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { SearchableSelect } from "@/shared/ui-components/controls/SearchableSelect";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
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
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-navy">
        {row.recruiter.firstName} {row.recruiter.lastName}
      </p>
      {row.recruiter.yearsExperience !== null && (
        <p className="text-xs text-muted-foreground">
          {row.recruiter.yearsExperience} yrs experience
        </p>
      )}
    </div>
  );
}

function SubmittedCell({ row }: { row: InboxSubmissionRow }) {
  return (
    <span
      className="whitespace-nowrap text-muted-foreground"
      title={formatDateTime(row.submittedAt)}
    >
      {formatTimeAgo(row.submittedAt)}
    </span>
  );
}

/**
 * The company inbox as the requirements doc frames it — a Job-based Candidate
 * Submission Queue. Job scopes the list, Status filters it, recruiter Rating
 * sets the default priority and submission Time breaks ties; a row opens its
 * conversation thread. Stat cards double as status filters.
 */
export function CompanySubmissionsQueue() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [recruiterKind, setRecruiterKind] = useState("");
  const [sortBy, setSortBy] = useState<SubmissionSort>("priority");

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = qInput.trim();
      // Only react when the effective query actually changes — typing then
      // deleting a trailing space must not silently bounce the user to page 1.
      setQ((current) => {
        if (current !== trimmed) setPage(1);
        return trimmed;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  const stats = useCompanySubmissionStats();
  // The dropdown needs every job with its new-submission count; 100 covers a
  // company's open listings comfortably (server caps larger asks anyway).
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

  const jobOptions = useMemo(
    () =>
      (jobs.data?.data ?? []).map((job) => ({
        value: job.jobId,
        label:
          job.newCandidateCount > 0
            ? `${job.jobTitle} — ${job.newCandidateCount} new`
            : job.jobTitle,
      })),
    [jobs.data],
  );

  const hasFilters =
    q !== "" || jobId !== null || status !== "" || recruiterKind !== "";

  const resetFilters = () => {
    setQInput("");
    setQ("");
    setJobId(null);
    setStatus("");
    setRecruiterKind("");
    setSortBy("priority");
    setPage(1);
  };

  const changeStatus = (next: string) => {
    setStatus(next);
    setPage(1);
  };

  const openThread = (candidateId: string) =>
    router.push(`/company/inbox/${candidateId}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-navy">
          Candidate Submissions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage candidate submissions from recruiters.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {STAT_CARDS.map(({ key, label, icon: Icon, value }) => {
          const active = key === "total" ? status === "" : status === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => changeStatus(key === "total" ? "" : key)}
              aria-pressed={active}
              className={cn(
                "rounded-md border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/50",
                active
                  ? "border-primary ring-1 ring-primary"
                  : "border-brand-line",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#616676]">
                  {label}
                </span>
                <Icon className="h-4 w-4 shrink-0 text-primary" />
              </span>
              <span className="mt-2 block text-2xl font-extrabold tabular-nums text-navy">
                {stats.data ? value(stats.data) : "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={qInput}
              onChange={(event) => setQInput(event.target.value)}
              placeholder="Search candidate, recruiter or job…"
              className="pl-9"
              aria-label="Search submissions"
            />
          </div>
          <SearchableSelect
            options={jobOptions}
            value={jobId}
            onChange={(next) => {
              setJobId(next);
              setPage(1);
            }}
            placeholder="All Jobs"
            clearLabel="All Jobs"
          />
          <NativeSelect
            aria-label="Filter by status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            <option value="">All Statuses</option>
            {CANDIDATE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {QUEUE_STATUS_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Filter by recruiter rating"
            value={recruiterKind}
            onChange={(event) => {
              setRecruiterKind(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Recruiters</option>
            <option value="rated">Rated Recruiters</option>
            <option value="unrated">Unrated Recruiters</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Sort submissions"
            value={sortBy}
            onChange={(event) => {
              setSortBy(sortValue(event.target.value));
              setPage(1);
            }}
          >
            {SUBMISSION_SORTS.map((value) => (
              <option key={value} value={value}>
                Sort: {SUBMISSION_SORT_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
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
      </div>

      {submissions.isPending ? (
        <TableSkeleton rows={6} />
      ) : submissions.isError ? (
        <ErrorRetryCallout
          message="Could not load your submissions."
          onRetry={() => void submissions.refetch()}
        />
      ) : submissions.data.data.length === 0 ? (
        <div className={cn(TABLE_CARD, "px-6 py-14 text-center")}>
          <p className="text-sm font-semibold text-navy">
            No submissions found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different search or filter."
              : "Recruiters' candidates will land here as they come in."}
          </p>
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden overflow-x-auto sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <th className={TABLE_TH}>Candidate</th>
                  <th className={TABLE_TH}>Job</th>
                  <th className={TABLE_TH}>Recruiter</th>
                  <th className={TABLE_TH}>Rating</th>
                  <th className={TABLE_TH}>Submitted</th>
                  <th className={TABLE_TH}>Status</th>
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
                        attention && "bg-primary/[0.04]",
                      )}
                      onClick={() => openThread(row.candidateId)}
                    >
                      <td className={TABLE_TD}>
                        <span className="flex items-center gap-2">
                          {attention && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-primary"
                              aria-label="Has unseen activity"
                            />
                          )}
                          <span className="font-medium text-navy">
                            {row.candidateName}
                          </span>
                        </span>
                      </td>
                      <td className={cn(TABLE_TD, "text-muted-foreground")}>
                        <span className="block max-w-[220px] truncate">
                          {row.jobTitle}
                        </span>
                      </td>
                      <td className={TABLE_TD}>
                        <RecruiterCell row={row} />
                      </td>
                      <td className={TABLE_TD}>
                        <RatingStars
                          value={row.recruiter?.ratingAvg ?? null}
                          count={row.recruiter?.ratingCount}
                        />
                      </td>
                      <td className={TABLE_TD}>
                        <SubmittedCell row={row} />
                      </td>
                      <td className={TABLE_TD}>
                        <StatusBadge
                          label={QUEUE_STATUS_LABELS[row.status]}
                          className={CANDIDATE_STATUS_STYLES[row.status]}
                        />
                      </td>
                      <td className={cn(TABLE_TD, "text-right")}>
                        <Link
                          href={`/company/inbox/${row.candidateId}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium text-primary transition-colors hover:bg-accent"
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
                    className={CANDIDATE_STATUS_STYLES[row.status]}
                  />
                }
                className={cn(
                  candidateNeedsAttention(row) && "bg-primary/[0.04]",
                )}
                fields={[
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
                    className="text-sm font-medium text-primary hover:underline"
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

/** Narrow a select's free string back into the typed filter params. */
function statusFilter(value: string): CandidateStatus | undefined {
  return CANDIDATE_STATUSES.find((status) => status === value);
}

function recruiterKindFilter(
  value: string,
): SubmissionRecruiterKind | undefined {
  return value === "rated" || value === "unrated" ? value : undefined;
}

function sortValue(value: string): SubmissionSort {
  return SUBMISSION_SORTS.find((sort) => sort === value) ?? "priority";
}
