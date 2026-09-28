"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Briefcase, RotateCcw, Trash2, X } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { ListToolbar } from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnFilter,
  FilterableHead,
} from "@/shared/ui-components/data/ColumnFilter";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { Pill } from "@/shared/ui-components/badges/Pill";
import { PageHeader } from "@/shared/ui-components/brand";
import {
  MobileRecordCard,
  MobileRecordList,
  type MobileRecordField,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { HIDE_PHASE2_FEATURES } from "@/shared/config/featureFlags";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Checkbox } from "@/shared/ui-components/controls/checkbox";
import { ConfirmActionDialog } from "@/shared/ui-components/controls/ConfirmActionDialog";
import {
  useAdminJobs,
  useAdminStats,
  useBulkDeleteAdminJobs,
  useBulkRepostAdminJobs,
  useMinRecruiterFeeSetting,
} from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { JOB_STATUS_LABELS, type AdminJobListItem } from "../schemas";
import { JobRowActions } from "./JobRowActions";
import { ListPager } from "./ListPager";
import { jobPath } from "@/features/jobs/utils/jobPath";
import { JOB_STATUS_TONES } from "./statusStyles";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_FILTER_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "filled", label: "Filled" },
  { value: "closed", label: "Closed" },
  { value: "expired", label: "Expired" },
] as const;

const COLUMNS: ColumnDef[] = [
  { key: "job", label: "Job", required: true },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "fee", label: "Recruiter fee" },
  // Candidates access is phase-2 — hidden for the phase-1 delivery.
  ...(HIDE_PHASE2_FEATURES ? [] : [{ key: "candidates", label: "Candidates" }]),
  { key: "posted", label: "Posted" },
  { key: "actions", label: "Actions", required: true },
];

function JobStatus({ status }: { status: AdminJobListItem["status"] }) {
  return (
    <StatusBadge
      label={JOB_STATUS_LABELS[status] ?? status}
      tone={JOB_STATUS_TONES[status] ?? "neutral"}
    />
  );
}

/** Logo + company name → its admin profile. */
function JobCompany({ job }: { job: AdminJobListItem }) {
  return (
    <div className="flex items-center gap-2">
      <CompanyLogo
        companyProfileId={job.companyProfileId}
        hasLogo={job.hasLogo}
        name={job.companyName}
        size="xs"
      />
      {job.companyUserId ? (
        <Link
          href={`/admin/companies/${job.companyUserId}`}
          className="block max-w-[200px] truncate font-[550] text-blue-ink hover:underline"
        >
          {job.companyName}
        </Link>
      ) : (
        <span className="block max-w-[200px] truncate text-ink-muted">
          {job.companyName}
        </span>
      )}
    </div>
  );
}

function JobFee({
  job,
  minFeeMinor,
}: {
  job: AdminJobListItem;
  minFeeMinor: number;
}) {
  return minFeeMinor > 0 && job.recruiterFeeMinor < minFeeMinor ? (
    <Pill tone="warn" plain className="tabular-nums">
      {formatMinor(job.recruiterFeeMinor)}
    </Pill>
  ) : (
    <span className="font-[650] tabular-nums text-ink">
      {formatMinor(job.recruiterFeeMinor)}
    </span>
  );
}

/** Submissions → the threads on this job. */
function JobCandidates({ job }: { job: AdminJobListItem }) {
  return job.candidateCount > 0 ? (
    <Link
      href={`/admin/conversations?jobId=${job.jobId}`}
      className="font-[550] tabular-nums text-blue-ink hover:underline"
    >
      {job.candidateCount}
    </Link>
  ) : (
    <span className="tabular-nums text-ink-faint">0</span>
  );
}

function JobCard({
  job,
  minFeeMinor,
}: {
  job: AdminJobListItem;
  minFeeMinor: number;
}) {
  const fields: MobileRecordField[] = [
    { label: "Company", value: <JobCompany job={job} /> },
    {
      label: "Recruiter fee",
      value: <JobFee job={job} minFeeMinor={minFeeMinor} />,
    },
    { label: "Posted", value: formatDate(job.createdAt) },
    ...(HIDE_PHASE2_FEATURES
      ? []
      : [{ label: "Candidates", value: <JobCandidates job={job} /> }]),
  ];

  return (
    <MobileRecordCard
      title={job.title}
      subtitle={job.locationState || undefined}
      href={jobPath({ id: job.jobId, title: job.title })}
      trailing={<JobStatus status={job.status} />}
      fields={fields}
      actions={
        <JobRowActions
          jobId={job.jobId}
          jobTitle={job.title}
          status={job.status}
        />
      }
    />
  );
}

interface JobsTableProps {
  /** When set, the list is restricted to one company (a deep-link). */
  companyProfileId?: string;
  companyName?: string;
  /** Pre-selected status filter (e.g. deep-linking to a company's open jobs). */
  initialStatus?: string;
}

export function JobsTable({
  companyProfileId,
  companyName,
  initialStatus = "",
}: JobsTableProps) {
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
  } = useListState(initialStatus);
  // A filter that matches nothing hides the header row it lives in, so the
  // empty state carries its own way back out. The company scope is a deep-link
  // with its own chip to clear, so it stays put.
  const hasFilters = qInput !== "" || status !== "";
  const resetFilters = () => {
    setQInput("");
    changeStatus("");
    setPage(1);
  };
  const cols = useVisibleColumns("admin.jobs.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminJobs({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    companyProfileId: companyProfileId || undefined,
  });

  // Multi-select is visible-rows-scoped: acting on rows you can no longer see
  // is how bulk tools delete the wrong things, so the selection is pruned to
  // the rows currently on screen whenever the list changes — pagination,
  // filtering, or a row deleted/re-posted out from under the selection.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<"repost" | "delete" | null>(
    null,
  );
  const bulkRepost = useBulkRepostAdminJobs();
  const bulkDelete = useBulkDeleteAdminJobs();
  const pageJobs = data?.data;
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set((pageJobs ?? []).map((job) => job.jobId));
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [pageJobs]);

  const allOnPageSelected =
    (pageJobs ?? []).length > 0 &&
    (pageJobs ?? []).every((job) => selected.has(job.jobId));

  const toggleOne = (jobId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      return next;
    });
  };

  const toggleAllOnPage = (checked: boolean) => {
    setSelected(
      checked ? new Set((pageJobs ?? []).map((job) => job.jobId)) : new Set(),
    );
  };

  const runBulk = (action: "repost" | "delete") => {
    const mutation = action === "repost" ? bulkRepost : bulkDelete;
    mutation.mutate([...selected], {
      onSuccess: (result) => {
        setBulkConfirm(null);
        // Skipped rows stay selected so a partial failure is actionable —
        // the admin can see exactly which jobs need attention and retry.
        setSelected(new Set(result.failed.map((failure) => failure.jobId)));
      },
      onError: () => setBulkConfirm(null),
    });
  };

  const stats = useAdminStats();
  const minFeeMinor = useMinRecruiterFeeSetting().data?.amountMinor ?? 0;
  const publishedJobs = useAdminJobs({
    page: 1,
    status: "published",
    limit: 100,
  });
  const liveTotal = publishedJobs.data?.meta.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Jobs"
        subtitle="Every job posted on the platform. Filter by company, status or title."
        metrics={[
          { label: "Live jobs", value: liveTotal },
          { label: "Scheduled", value: stats.data?.scheduledJobs ?? 0 },
          { label: "Offers", value: stats.data?.offerJobs ?? 0 },
        ]}
      />

      {companyProfileId && (
        <div className="flex items-center gap-2">
          {/* `.chip is-active` — the active company filter, with its own clear. */}
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-blue bg-blue px-[11px] text-[12.5px] font-[550] text-white">
            Company: {companyName || "Selected company"}
            <Link
              href="/admin/jobs"
              aria-label="Clear company filter"
              className="rounded-full p-0.5 transition-colors hover:bg-white/20"
            >
              <X className="size-3" />
            </Link>
          </span>
        </div>
      )}

      <div className={TABLE_TOOLBAR}>
        <div className="flex-1">
          <ListToolbar
            query={qInput}
            onQueryChange={setQInput}
            placeholder="Search jobs by title…"
            filter={{
              value: status,
              onChange: changeStatus,
              allLabel: "All statuses",
              options: [...STATUS_FILTER_OPTIONS],
            }}
          />
        </div>
        <div className="sm:ml-auto">
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="hidden flex-wrap items-center gap-3 rounded-sm border border-blue bg-tint px-3.5 py-2.5 sm:flex">
          <span className="text-sub font-[650] tabular-nums text-blue-ink">
            {selected.size} selected
          </span>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkConfirm("repost")}
            >
              <RotateCcw />
              Re-post
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkConfirm("delete")}
            >
              <Trash2 />
              Delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load jobs.
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data.data.length === 0 ? (
        <div className={TABLE_CARD}>
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
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
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={cn(TABLE_TH, "w-10 px-0 pl-3.5")}>
                    <Checkbox
                      aria-label="Select all jobs on this page"
                      checked={allOnPageSelected}
                      onCheckedChange={(checked) =>
                        toggleAllOnPage(checked === true)
                      }
                    />
                  </th>
                  <th scope="col" className={cn(TABLE_TH, "w-[28%]")}>
                    Job
                  </th>
                  {cols.isVisible("company") && (
                    <th scope="col" className={TABLE_TH}>
                      Company
                    </th>
                  )}
                  {cols.isVisible("status") && (
                    <FilterableHead label="Status">
                      <ColumnFilter
                        label="Status"
                        options={STATUS_FILTER_OPTIONS}
                        value={status === "" ? null : status}
                        onChange={(next) => changeStatus(next ?? "")}
                      />
                    </FilterableHead>
                  )}
                  {cols.isVisible("fee") && (
                    <th scope="col" className={cn(TABLE_TH, "text-right")}>
                      Recruiter fee
                    </th>
                  )}
                  {!HIDE_PHASE2_FEATURES && cols.isVisible("candidates") && (
                    <th scope="col" className={cn(TABLE_TH, "text-center")}>
                      Candidates
                    </th>
                  )}
                  {cols.isVisible("posted") && (
                    <th scope="col" className={TABLE_TH}>
                      Posted
                    </th>
                  )}
                  <th scope="col" className={cn(TABLE_TH, "w-11 text-right")}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {data.data.map((job) => (
                  <tr key={job.jobId} className={TABLE_ROW}>
                    <td className={cn(TABLE_TD, "w-10 px-0 pl-3.5")}>
                      <Checkbox
                        aria-label={`Select ${job.title}`}
                        checked={selected.has(job.jobId)}
                        onCheckedChange={(checked) =>
                          toggleOne(job.jobId, checked === true)
                        }
                      />
                    </td>
                    <td className={TABLE_TD_STACKED}>
                      {/* Job title → the public job view. */}
                      <Link
                        href={jobPath({ id: job.jobId, title: job.title })}
                        className={cn(
                          TABLE_CELL_MAIN,
                          "block max-w-[260px] truncate transition-colors hover:text-blue",
                        )}
                      >
                        {job.title}
                      </Link>
                      <p className={TABLE_CELL_SUB}>
                        {job.locationState || "—"}
                      </p>
                    </td>
                    {cols.isVisible("company") && (
                      <td className={TABLE_TD}>
                        <JobCompany job={job} />
                      </td>
                    )}
                    {cols.isVisible("status") && (
                      <td className={TABLE_TD}>
                        <JobStatus status={job.status} />
                      </td>
                    )}
                    {cols.isVisible("fee") && (
                      <td
                        className={cn(TABLE_TD, "whitespace-nowrap text-right")}
                      >
                        <JobFee job={job} minFeeMinor={minFeeMinor} />
                      </td>
                    )}
                    {!HIDE_PHASE2_FEATURES && cols.isVisible("candidates") && (
                      <td className={cn(TABLE_TD, "text-center")}>
                        <JobCandidates job={job} />
                      </td>
                    )}
                    {cols.isVisible("posted") && (
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap tabular-nums text-ink-muted",
                        )}
                      >
                        {formatDate(job.createdAt)}
                      </td>
                    )}
                    <td className={cn(TABLE_TD, "text-right")}>
                      <JobRowActions
                        jobId={job.jobId}
                        jobTitle={job.title}
                        status={job.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MobileRecordList className="sm:hidden">
            {data.data.map((job) => (
              <JobCard key={job.jobId} job={job} minFeeMinor={minFeeMinor} />
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
        </div>
      )}

      <ConfirmActionDialog
        open={bulkConfirm === "repost"}
        onOpenChange={(open) => setBulkConfirm(open ? "repost" : null)}
        title={`Re-post ${selected.size} selected job${selected.size === 1 ? "" : "s"}?`}
        description="Expired listings go live again for 30 days; anything not expired is skipped and reported. Fees are re-checked against the current floor and each company's funds."
        confirmLabel="Re-post"
        pendingLabel="Re-posting…"
        isPending={bulkRepost.isPending}
        onConfirm={() => runBulk("repost")}
      />
      <ConfirmActionDialog
        open={bulkConfirm === "delete"}
        onOpenChange={(open) => setBulkConfirm(open ? "delete" : null)}
        title={`Delete ${selected.size} selected job${selected.size === 1 ? "" : "s"}?`}
        description="Each job is removed independently; filled jobs are skipped and reported. This is recoverable by support."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        destructive
        isPending={bulkDelete.isPending}
        onConfirm={() => runBulk("delete")}
      />
    </div>
  );
}
