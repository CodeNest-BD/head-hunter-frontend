"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Briefcase, RotateCcw, Trash2, X } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { PageBanner } from "@/shared/ui-components/brand";
import {
  MobileRecordCard,
  MobileRecordList,
  type MobileRecordField,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { HIDE_PHASE2_FEATURES } from "@/shared/config/featureFlags";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { Checkbox } from "@/shared/ui-components/controls/checkbox";
import {
  useAdminJobs,
  useAdminStats,
  useBulkDeleteAdminJobs,
  useBulkRepostAdminJobs,
  useMinRecruiterFeeSetting,
} from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { JOB_STATUS_LABELS, type AdminJobListItem } from "../schemas";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { JobRowActions } from "./JobRowActions";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
import { jobPath } from "@/features/jobs/utils/jobPath";
import { JOB_STATUS_STYLES } from "./statusStyles";
import { BODY_ROW_CLASS, TABLE_CLASS, THEAD_ROW_CLASS } from "./tableStyles";
import { TABLE_TOOLBAR } from "@/shared/ui-components/data/tableStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
      className={JOB_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}
    />
  );
}

/** Logo + company name → its admin profile. */
function JobCompany({ job }: { job: AdminJobListItem }) {
  return (
    <div className="flex items-center gap-2.5 text-muted-foreground">
      <CompanyLogo
        companyProfileId={job.companyProfileId}
        hasLogo={job.hasLogo}
        name={job.companyName}
        size="xs"
      />
      {job.companyUserId ? (
        <Link
          href={`/admin/companies/${job.companyUserId}`}
          className="block max-w-[200px] truncate text-navy hover:text-primary hover:underline"
        >
          {job.companyName}
        </Link>
      ) : (
        <span className="block max-w-[200px] truncate">{job.companyName}</span>
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
    <span className="inline-flex items-center rounded-full bg-[#FBF3DF] px-2 py-0.5 text-xs font-semibold text-[#7A5109]">
      {formatMinor(job.recruiterFeeMinor)}
    </span>
  ) : (
    <span className="font-bold tabular-nums text-navy">
      {formatMinor(job.recruiterFeeMinor)}
    </span>
  );
}

/** Submissions → the threads on this job. */
function JobCandidates({ job }: { job: AdminJobListItem }) {
  return job.candidateCount > 0 ? (
    <Link
      href={`/admin/conversations?jobId=${job.jobId}`}
      className="font-medium text-primary hover:underline"
    >
      {job.candidateCount}
    </Link>
  ) : (
    <span className="text-muted-foreground">0</span>
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
  const cols = useVisibleColumns("admin.jobs.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminJobs({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    companyProfileId: companyProfileId || undefined,
  });

  // Multi-select is page-scoped: acting on rows you can no longer see is how
  // bulk tools delete the wrong things, so navigation/filtering clears it.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<"repost" | "delete" | null>(
    null,
  );
  const bulkRepost = useBulkRepostAdminJobs();
  const bulkDelete = useBulkDeleteAdminJobs();
  useEffect(() => {
    setSelected(new Set());
  }, [page, q, status, limit, companyProfileId]);

  const pageJobs = data?.data ?? [];
  const allOnPageSelected =
    pageJobs.length > 0 && pageJobs.every((job) => selected.has(job.jobId));

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
      checked ? new Set(pageJobs.map((job) => job.jobId)) : new Set(),
    );
  };

  const runBulk = (action: "repost" | "delete") => {
    const mutation = action === "repost" ? bulkRepost : bulkDelete;
    mutation.mutate([...selected], {
      onSuccess: () => {
        setBulkConfirm(null);
        setSelected(new Set());
      },
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
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Jobs"
        subtitle="Every job posted on the platform. Filter by company, status or title."
        metrics={[
          { label: "Live jobs", value: liveTotal },
          { label: "Scheduled", value: stats.data?.scheduledJobs ?? 0 },
          { label: "Offers", value: stats.data?.offerJobs ?? 0 },
        ]}
      />

      <div className="flex flex-col gap-4">
        {companyProfileId && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 font-medium text-primary">
              Company: {companyName || "Selected company"}
              <Link
                href="/admin/jobs"
                aria-label="Clear company filter"
                className="rounded-full p-0.5 hover:bg-primary/10"
              >
                <X className="h-3.5 w-3.5" />
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
                options: [
                  { value: "published", label: "Published" },
                  { value: "draft", label: "Draft" },
                  { value: "paused", label: "Paused" },
                  { value: "filled", label: "Filled" },
                  { value: "closed", label: "Closed" },
                  { value: "expired", label: "Expired" },
                ],
              }}
            />
          </div>
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-accent px-4 py-2.5 text-sm">
            <span className="font-semibold text-navy">
              {selected.size} selected
            </span>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkConfirm("repost")}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Re-post
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setBulkConfirm("delete")}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
              <AlertCircle className="h-6 w-6" />
              Could not load jobs.
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : data.data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                <Briefcase className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-navy">No jobs found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search or filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="hidden w-full overflow-x-auto sm:block">
                <table className={TABLE_CLASS}>
                  <thead>
                    <tr className={THEAD_ROW_CLASS}>
                      <th scope="col" className="w-10 py-3 pl-4">
                        <Checkbox
                          aria-label="Select all jobs on this page"
                          checked={allOnPageSelected}
                          onCheckedChange={(checked) =>
                            toggleAllOnPage(checked === true)
                          }
                        />
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Job
                      </th>
                      {cols.isVisible("company") && (
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Company
                        </th>
                      )}
                      {cols.isVisible("status") && (
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Status
                        </th>
                      )}
                      {cols.isVisible("fee") && (
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-semibold"
                        >
                          Recruiter fee
                        </th>
                      )}
                      {!HIDE_PHASE2_FEATURES &&
                        cols.isVisible("candidates") && (
                          <th
                            scope="col"
                            className="px-5 py-3 text-center font-semibold"
                          >
                            Candidates
                          </th>
                        )}
                      {cols.isVisible("posted") && (
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Posted
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-semibold"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((job) => (
                      <tr key={job.jobId} className={BODY_ROW_CLASS}>
                        <td className="w-10 py-3 pl-4">
                          <Checkbox
                            aria-label={`Select ${job.title}`}
                            checked={selected.has(job.jobId)}
                            onCheckedChange={(checked) =>
                              toggleOne(job.jobId, checked === true)
                            }
                          />
                        </td>
                        <td className="px-5 py-3">
                          {/* Job title → the public job view. */}
                          <Link
                            href={jobPath({ id: job.jobId, title: job.title })}
                            className="block max-w-[260px] truncate font-medium text-navy hover:text-primary hover:underline"
                          >
                            {job.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {job.locationState || "—"}
                          </span>
                        </td>
                        {cols.isVisible("company") && (
                          <td className="px-5 py-3 text-muted-foreground">
                            <JobCompany job={job} />
                          </td>
                        )}
                        {cols.isVisible("status") && (
                          <td className="px-5 py-3">
                            <JobStatus status={job.status} />
                          </td>
                        )}
                        {cols.isVisible("fee") && (
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            <JobFee job={job} minFeeMinor={minFeeMinor} />
                          </td>
                        )}
                        {!HIDE_PHASE2_FEATURES &&
                          cols.isVisible("candidates") && (
                            <td className="px-5 py-3 text-center tabular-nums">
                              <JobCandidates job={job} />
                            </td>
                          )}
                        {cols.isVisible("posted") && (
                          <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                            {formatDate(job.createdAt)}
                          </td>
                        )}
                        <td className="px-5 py-3 text-right">
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
                  <JobCard
                    key={job.jobId}
                    job={job}
                    minFeeMinor={minFeeMinor}
                  />
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
            </CardContent>
          </Card>
        )}
      </div>

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
