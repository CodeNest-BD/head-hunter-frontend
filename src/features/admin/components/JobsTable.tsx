"use client";

import Link from "next/link";
import { AlertCircle, Briefcase, X } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { PageBanner } from "@/shared/ui-components/brand";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  useAdminJobs,
  useAdminStats,
  useMinRecruiterFeeSetting,
} from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { JOB_STATUS_LABELS } from "../schemas";
import { JobRowActions } from "./JobRowActions";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
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
  { key: "candidates", label: "Candidates" },
  { key: "posted", label: "Posted" },
  { key: "actions", label: "Actions", required: true },
];

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

  const stats = useAdminStats();
  const minFeeMinor = useMinRecruiterFeeSetting().data?.amountMinor ?? 0;
  const publishedJobs = useAdminJobs({
    page: 1,
    status: "published",
    limit: 100,
  });
  const liveTotal = publishedJobs.data?.meta.total ?? 0;
  const belowMinCount = (publishedJobs.data?.data ?? []).filter(
    (j) => j.recruiterFeeMinor < minFeeMinor,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Jobs"
        subtitle="Every job posted on the platform. Filter by company, status or title."
        metrics={[
          { label: "Live jobs", value: liveTotal },
          {
            label: "Below minimum",
            value: (
              <span
                className={belowMinCount > 0 ? "text-[#F3C24B]" : undefined}
              >
                {belowMinCount}
              </span>
            ),
          },
          { label: "Conversations", value: stats.data?.conversations ?? 0 },
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
              <div className="w-full">
                <table className={TABLE_CLASS}>
                  <thead>
                    <tr className={THEAD_ROW_CLASS}>
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
                      {cols.isVisible("candidates") && (
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
                        <td className="px-5 py-3">
                          {/* Job title → the public job view. */}
                          <Link
                            href={`/jobs/${job.jobId}`}
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
                            {/* Company name → its admin profile. */}
                            {job.companyUserId ? (
                              <Link
                                href={`/admin/companies/${job.companyUserId}`}
                                className="block max-w-[200px] truncate text-navy hover:text-primary hover:underline"
                              >
                                {job.companyName}
                              </Link>
                            ) : (
                              <span className="block max-w-[200px] truncate">
                                {job.companyName}
                              </span>
                            )}
                          </td>
                        )}
                        {cols.isVisible("status") && (
                          <td className="px-5 py-3">
                            <StatusBadge
                              label={
                                JOB_STATUS_LABELS[job.status] ?? job.status
                              }
                              className={
                                JOB_STATUS_STYLES[job.status] ??
                                "bg-muted text-muted-foreground"
                              }
                            />
                          </td>
                        )}
                        {cols.isVisible("fee") && (
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            {minFeeMinor > 0 &&
                            job.recruiterFeeMinor < minFeeMinor ? (
                              <span className="inline-flex items-center rounded-full bg-[#FBF3DF] px-2 py-0.5 text-xs font-semibold text-[#7A5109]">
                                {formatMinor(job.recruiterFeeMinor)}
                              </span>
                            ) : (
                              <span className="font-bold tabular-nums text-navy">
                                {formatMinor(job.recruiterFeeMinor)}
                              </span>
                            )}
                          </td>
                        )}
                        {cols.isVisible("candidates") && (
                          <td className="px-5 py-3 text-center tabular-nums">
                            {/* Submissions → the threads on this job. */}
                            {job.candidateCount > 0 ? (
                              <Link
                                href={`/admin/conversations?jobId=${job.jobId}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {job.candidateCount}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
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
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

        {belowMinCount > 0 && (
          <p className="rounded-md border border-[#F0E2B8] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5109]">
            {belowMinCount} live job{belowMinCount === 1 ? "" : "s"} were
            published below the current {formatMinor(minFeeMinor)} minimum.
            Raising the minimum does not affect them.
          </p>
        )}
      </div>
    </div>
  );
}
