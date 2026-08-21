"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Briefcase, Plus } from "lucide-react";

// Deep-imported (not via the feature barrels): JobsTable is exported from the
// jobs barrel, and the submissions barrel imports back from jobs — the barrel
// paths would close an import cycle.
import { useWallet } from "@/features/billing/hooks/useBilling";
import { useInboxJobs } from "@/features/submissions/hooks/useSubmissions";
import { PageBanner } from "@/shared/ui-components/brand";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { ListToolbar } from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
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
import { useListState } from "@/shared/hooks/useListState";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import {
  ROLE_CATEGORY_LABELS,
  jobStatusSchema,
  type RoleCategory,
} from "../schemas";
import { useJobs } from "../hooks/useJobs";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  filled: "Filled",
  closed: "Closed",
  expired: "Expired",
};

const COLUMNS: ColumnDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category" },
  { key: "fee", label: "Recruiter fee" },
  { key: "submissions", label: "Submissions" },
  { key: "actions", label: "Actions", required: true },
];

const CATEGORY_OPTIONS = (
  Object.entries(ROLE_CATEGORY_LABELS) as [RoleCategory, string][]
).map(([value, label]) => ({ value, label }));

export function JobsTable() {
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
  const [category, setCategory] = useState("");
  const cols = useVisibleColumns("company.jobs.columns", COLUMNS);
  const parsedStatus = jobStatusSchema.safeParse(status);
  const { data, isPending, isError, refetch } = useJobs({
    page,
    limit,
    q: q || undefined,
    status: parsedStatus.success ? parsedStatus.data : undefined,
    roleCategory: category || undefined,
  });

  // Banner metrics + the fee-consequence note, from the full published set.
  const publishedJobs = useJobs({ page: 1, status: "published", limit: 100 });
  const publishedTotal = publishedJobs.data?.meta.total ?? 0;
  const noFeeCount = (publishedJobs.data?.data ?? []).filter(
    (job) => job.recruiterFeeMinor === 0,
  ).length;
  const wallet = useWallet();

  // Submissions live on the inbox rows, not the job; one fetch builds a lookup.
  const inbox = useInboxJobs({ page: 1, limit: 100 });
  const submissionsByJob = new Map(
    (inbox.data?.data ?? []).map((row) => [
      row.jobId,
      { total: row.submissionCount, fresh: row.newSubmissionCount },
    ]),
  );

  const toolbar = (
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
          extraFilter={{
            value: category,
            onChange: (next) => {
              setCategory(next);
              setPage(1);
            },
            allLabel: "All categories",
            options: CATEGORY_OPTIONS,
          }}
        />
      </div>
      <ColumnsToggle
        columns={cols.columns}
        isVisible={cols.isVisible}
        onToggle={cols.toggle}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Jobs"
        subtitle="Create a job, then publish it to notify your followers."
        metrics={[
          { label: "Published", value: publishedTotal },
          {
            label: "No fee set",
            value: (
              <span className={noFeeCount > 0 ? "text-[#F3C24B]" : undefined}>
                {noFeeCount}
              </span>
            ),
          },
          {
            label: "Fees reserved",
            value: formatMinor(wallet.data?.reservedMinor),
          },
        ]}
      />

      <div className="flex flex-col gap-4">
        {toolbar}

        {isError ? (
          <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-[18px] w-[18px]" />
              Could not load jobs.
            </div>
            <button
              type="button"
              className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        ) : isPending ? (
          <TableSkeleton />
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Briefcase className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-semibold text-navy">
                No jobs found
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try a different search or filter, or post a new role.
              </p>
            </div>
            <Link
              href="/company/jobs/new"
              className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-[18px] w-[18px]" />
              New job
            </Link>
          </div>
        ) : (
          <>
            <div className={TABLE_CARD}>
              <div className={TABLE_SCROLL}>
                <table className={TABLE_EL}>
                  <thead className={TABLE_HEAD}>
                    <tr className={TABLE_HEAD_ROW}>
                      <th className={TABLE_TH}>Title</th>
                      {cols.isVisible("category") && (
                        <th className={TABLE_TH}>Category</th>
                      )}
                      {cols.isVisible("fee") && (
                        <th className={TABLE_TH}>Recruiter fee</th>
                      )}
                      {cols.isVisible("submissions") && (
                        <th className={TABLE_TH}>Submissions</th>
                      )}
                      <th className={TABLE_TH} />
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY}>
                    {data.data.map((job) => {
                      const subs = submissionsByJob.get(job.id);
                      const dateLabel = formatDate(
                        job.publishedAt ?? job.createdAt,
                      );
                      return (
                        <tr key={job.id} className={TABLE_ROW}>
                          <td className={TABLE_TD}>
                            <Link
                              href={`/company/jobs/${job.id}`}
                              className="font-semibold text-navy transition-colors hover:text-primary"
                            >
                              {job.title}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {STATUS_LABELS[job.status] ?? job.status} ·{" "}
                              {dateLabel}
                            </p>
                          </td>
                          {cols.isVisible("category") && (
                            <td className={`${TABLE_TD} text-brand-gray`}>
                              {ROLE_CATEGORY_LABELS[job.roleCategory]}
                            </td>
                          )}
                          {cols.isVisible("fee") && (
                            <td className={TABLE_TD}>
                              {job.recruiterFeeMinor === 0 ? (
                                <span className="inline-flex items-center rounded-full bg-[#FBF3DF] px-2 py-0.5 text-xs font-semibold text-[#7A5109]">
                                  $0
                                </span>
                              ) : (
                                <span className="font-bold tabular-nums text-navy">
                                  {formatMinor(job.recruiterFeeMinor)}
                                </span>
                              )}
                            </td>
                          )}
                          {cols.isVisible("submissions") && (
                            <td className={`${TABLE_TD} tabular-nums`}>
                              {subs && subs.fresh > 0 ? (
                                <span className="font-semibold text-primary">
                                  {subs.fresh} new
                                </span>
                              ) : (
                                <span className="text-brand-gray">
                                  {subs?.total ?? 0}
                                </span>
                              )}
                            </td>
                          )}
                          <td className={`${TABLE_TD} text-right`}>
                            <Link
                              href={`/company/jobs/${job.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                            >
                              Edit
                              <span aria-hidden="true">→</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePager
                page={page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                pageSize={limit}
                onPage={setPage}
                onPageSize={changeLimit}
              />
            </div>

            {noFeeCount > 0 && (
              <p className="rounded-md border border-[#F0E2B8] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5109]">
                {noFeeCount} published job{noFeeCount === 1 ? "" : "s"} have no
                recruiter fee. Recruiters sort by fee, so these rank last.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
