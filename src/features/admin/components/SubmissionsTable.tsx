"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Inbox } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  ToolbarSearch,
  ToolbarSearchableSelect,
  ToolbarSelect,
} from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import {
  MobileRecordCard,
  MobileRecordList,
  type MobileRecordField,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL_MAIN,
  TABLE_CELL_SUB,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TD_STACKED,
  TABLE_TH,
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import { adminConversationPath } from "@/shared/utils/entityPaths";
import { useAdminConversations } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { useSubmissionFilterOptions } from "../hooks/useSubmissionFilterOptions";
import { ListPager } from "./ListPager";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";
import type { ConversationListItem } from "../schemas";

/** The design's status wording for a submission. */
const STATUS_LABELS: Record<string, string> = {
  submitted: "New",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offer",
  hired: "Hired",
  passed: "Rejected",
  unknown: "Unknown",
};

const STATUS_FILTER_OPTIONS = [
  { value: "submitted", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "passed", label: "Rejected" },
] as const;

/** The windows the design offers, newest-relative rather than absolute. */
const WINDOW_FILTER_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

const COLUMNS: ColumnDef[] = [
  { key: "candidate", label: "Candidate", required: true },
  { key: "job", label: "Job · Company" },
  { key: "recruiter", label: "Recruiter" },
  { key: "rating", label: "Rating" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status", required: true },
];

function formatSubmitted(iso: string): string {
  if (!iso) return "—";
  const at = new Date(iso);
  return `${at.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}, ${at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

/** `SUB-51230` — the submission's URL alias, as the design prints it. */
function submissionRef(row: ConversationListItem): string {
  return row.candidateSerialNumber
    ? `SUB-${row.candidateSerialNumber}`
    : "SUB-—";
}

function SubmissionStatus({ row }: { row: ConversationListItem }) {
  return (
    <StatusBadge
      label={STATUS_LABELS[row.status] ?? row.status}
      tone={CANDIDATE_STATUS_TONES[row.status] ?? "neutral"}
    />
  );
}

function SubmissionCard({ row }: { row: ConversationListItem }) {
  const fields: MobileRecordField[] = [
    { label: "Job", value: `${row.jobTitle} · ${row.companyName}` },
    { label: "Recruiter", value: row.recruiterName },
    {
      label: "Rating",
      value: (
        <RatingStars
          variant="text"
          value={row.recruiterRatingAvg}
          count={row.recruiterRatingCount}
        />
      ),
    },
    { label: "Submitted", value: formatSubmitted(row.submittedAt) },
  ];
  return (
    <MobileRecordCard
      title={row.candidateName}
      subtitle={submissionRef(row)}
      href={adminConversationPath({
        id: row.candidateId,
        serialNumber: row.candidateSerialNumber,
      })}
      trailing={<SubmissionStatus row={row} />}
      fields={fields}
    />
  );
}

/**
 * Every candidate sent to a job, one row each. Distinct from Conversations,
 * which is the same rows read as threads — this board is about what was
 * submitted and where it got to, not who said what.
 */
export function SubmissionsTable({
  initialJobId = "",
}: {
  /** Pre-selected job filter (the job page's "Submissions" deep-link). */
  initialJobId?: string;
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
  const [withinDays, setWithinDays] = useState("");
  const [jobId, setJobId] = useState(initialJobId);
  const [companyProfileId, setCompanyProfileId] = useState("");
  const [recruiterProfileId, setRecruiterProfileId] = useState("");
  // The admin is monitoring the marketplace, so their own order is the
  // default; "ranking" previews what the company sees instead.
  const [order, setOrder] = useState<"newest" | "ranking">("newest");
  const { jobOptions, companyOptions, recruiterOptions } =
    useSubmissionFilterOptions(companyProfileId);

  const hasFilters =
    qInput !== "" ||
    status !== "" ||
    withinDays !== "" ||
    jobId !== "" ||
    companyProfileId !== "" ||
    recruiterProfileId !== "";
  const resetFilters = () => {
    setQInput("");
    changeStatus("");
    setWithinDays("");
    setJobId("");
    setCompanyProfileId("");
    setRecruiterProfileId("");
    setPage(1);
  };
  const applyFilter = (set: (next: string) => void) => (next: string) => {
    set(next);
    setPage(1);
  };
  // The job list narrows to the chosen company, so a job picked under another
  // company would be filtering on something the picker can no longer show.
  const changeCompany = (next: string) => {
    setCompanyProfileId(next);
    setJobId("");
    setPage(1);
  };
  const cols = useVisibleColumns("admin.submissions.columns", COLUMNS);

  const { data, isPending, isError, refetch } = useAdminConversations({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    withinDays: withinDays ? Number(withinDays) : undefined,
    jobId: jobId || undefined,
    companyProfileId: companyProfileId || undefined,
    recruiterProfileId: recruiterProfileId || undefined,
    order,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sub text-ink-muted">
          One row per candidate, each tied to one job, company and recruiter.
        </p>
        {/* A segmented control, not a filter: both views hold the same rows,
            and only the order changes. */}
        <div
          role="group"
          aria-label="Submission order"
          className="inline-flex rounded-sm bg-surface-sunken p-0.5"
        >
          {(
            [
              ["newest", "Admin view"],
              ["ranking", "Company ranking"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={order === value}
              onClick={() => {
                setOrder(value);
                setPage(1);
              }}
              className={cn(
                "h-7.5 rounded-xs px-3 text-sub font-medium transition-colors",
                order === value
                  ? "bg-surface text-ink shadow-chip"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={TABLE_CARD}>
        <div className={TABLE_TOOLBAR}>
          <ToolbarSearch
            value={qInput}
            onChange={setQInput}
            placeholder="Search candidate, job, company or recruiter"
            className="min-w-[200px] flex-[1_1_240px] sm:max-w-[320px]"
          />
          <ToolbarSelect
            label="Submission status"
            value={status}
            onChange={changeStatus}
            allLabel="Any status"
            options={STATUS_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Submitted within"
            value={withinDays}
            onChange={applyFilter(setWithinDays)}
            allLabel="Any time"
            options={WINDOW_FILTER_OPTIONS}
          />
          <ToolbarSearchableSelect
            value={jobId}
            onChange={applyFilter(setJobId)}
            allLabel="All jobs"
            searchPlaceholder="Search jobs…"
            options={jobOptions}
          />
          <ToolbarSearchableSelect
            value={companyProfileId}
            onChange={changeCompany}
            allLabel="All companies"
            searchPlaceholder="Search companies…"
            options={companyOptions}
          />
          <ToolbarSearchableSelect
            value={recruiterProfileId}
            onChange={applyFilter(setRecruiterProfileId)}
            allLabel="All recruiters"
            searchPlaceholder="Search recruiters…"
            options={recruiterOptions}
          />
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          )}
          <div className="ml-auto">
            <ColumnsToggle
              columns={cols.columns}
              isVisible={cols.isVisible}
              onToggle={cols.toggle}
            />
          </div>
        </div>

        <p className="border-t border-line bg-surface-sub px-5 py-2.5 text-meta text-ink-muted">
          <span className="font-[650] text-ink">
            {order === "newest"
              ? "Admin view, newest first."
              : "Company ranking."}
          </span>{" "}
          {order === "newest"
            ? "You’re monitoring the marketplace, so this isn’t the company’s ranking. Switch to Company ranking to preview their order."
            : "Rated recruiters first — this is the order the company sees. Review count is context only and never changes ranking."}
        </p>

        {isPending ? (
          <TableSkeleton className="rounded-none shadow-none" columns={5} />
        ) : isError ? (
          <div className="m-5 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
            <div className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px] shrink-0" />
              Could not load submissions.
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No submissions found"
            description="Try a different search or filter."
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
        ) : (
          <>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={cn(TABLE_TH, "w-12 text-right")}>
                      #
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Candidate
                    </th>
                    {cols.isVisible("job") && (
                      <th scope="col" className={TABLE_TH}>
                        Job · Company
                      </th>
                    )}
                    {cols.isVisible("recruiter") && (
                      <th scope="col" className={TABLE_TH}>
                        Recruiter
                      </th>
                    )}
                    {cols.isVisible("rating") && (
                      <th scope="col" className={TABLE_TH}>
                        Rating
                      </th>
                    )}
                    {cols.isVisible("submitted") && (
                      <th scope="col" className={TABLE_TH}>
                        Submitted
                      </th>
                    )}
                    <th scope="col" className={TABLE_TH}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {data.data.map((row, index) => (
                    <tr key={row.candidateId} className={TABLE_ROW}>
                      <td
                        className={cn(
                          TABLE_TD,
                          "text-right tabular-nums text-ink-faint",
                        )}
                      >
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className={TABLE_TD_STACKED}>
                        <Link
                          href={adminConversationPath({
                            id: row.candidateId,
                            serialNumber: row.candidateSerialNumber,
                          })}
                          className={cn(
                            TABLE_CELL_MAIN,
                            "block transition-colors hover:text-blue focus-visible:underline focus-visible:outline-none",
                          )}
                        >
                          {row.candidateName}
                        </Link>
                        <span className={cn(TABLE_CELL_SUB, "tabular-nums")}>
                          {submissionRef(row)}
                        </span>
                      </td>
                      {cols.isVisible("job") && (
                        <td className={TABLE_TD_STACKED}>
                          <span className="block text-ink">{row.jobTitle}</span>
                          <span className={TABLE_CELL_SUB}>
                            {row.companyName}
                          </span>
                        </td>
                      )}
                      {cols.isVisible("recruiter") && (
                        <td className={cn(TABLE_TD, "text-ink-body")}>
                          {row.recruiterName}
                        </td>
                      )}
                      {cols.isVisible("rating") && (
                        <td className={cn(TABLE_TD, "whitespace-nowrap")}>
                          <RatingStars
                            variant="text"
                            value={row.recruiterRatingAvg}
                            count={row.recruiterRatingCount}
                          />
                        </td>
                      )}
                      {cols.isVisible("submitted") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap tabular-nums text-ink-muted",
                          )}
                        >
                          {formatSubmitted(row.submittedAt)}
                        </td>
                      )}
                      <td className={TABLE_TD}>
                        <SubmissionStatus row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MobileRecordList className="sm:hidden">
              {data.data.map((row) => (
                <SubmissionCard key={row.candidateId} row={row} />
              ))}
            </MobileRecordList>
            <ListPager
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPage={setPage}
              pageSize={limit}
              onPageSize={changeLimit}
            />
          </>
        )}
      </div>
    </div>
  );
}
