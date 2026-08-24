"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Eye,
  MoreHorizontal,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";

// Deep-imported (not via the feature barrels): JobsTable is exported from the
// jobs barrel, and the inbox barrel imports back from jobs — the barrel
// paths would close an import cycle.
import { useWallet } from "@/features/billing/hooks/useBilling";
import { useInboxJobs } from "@/features/inbox/hooks/useInbox";
import { PageBanner } from "@/shared/ui-components/brand";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
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
import { Button } from "@/shared/ui-components/controls/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import {
  ROLE_CATEGORY_LABELS,
  jobStatusSchema,
  type RoleCategory,
} from "../schemas";
import { useDeleteJob, useJobs } from "../hooks/useJobs";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  filled: "Filled",
  closed: "Closed",
  expired: "Expired",
};

/** Per-status pill colors for the Status column (mirrors the job detail page). */
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "text-[#17734E] bg-[#E7F4EC]",
  expired: "text-[#9B3535] bg-[#FBEAEA]",
  paused: "text-[#92610C] bg-[#FBF3DF]",
  filled: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
};

/** The statuses a job actually reaches in the product, for the filter. */
const STATUS_FILTER_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
] as const;

const COLUMNS: ColumnDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "status", label: "Status" },
  { key: "category", label: "Category" },
  { key: "fee", label: "Recruiter fee" },
  { key: "candidates", label: "Candidates" },
  { key: "actions", label: "Actions", required: true },
];

const CATEGORY_OPTIONS = (
  Object.entries(ROLE_CATEGORY_LABELS) as [RoleCategory, string][]
).map(([value, label]) => ({ value, label }));

/**
 * Per-row actions behind a kebab menu: View (the public-style detail), Edit,
 * and a two-step Delete (soft-delete) so the destructive action needs a
 * deliberate confirm.
 */
function JobRowActions({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteJob();

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirming(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Job actions"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {confirming ? (
          <div className="p-2">
            <p className="mb-2.5 text-xs text-muted-foreground">
              Delete this job? This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={del.isPending}
                onClick={() =>
                  del.mutate(jobId, { onSuccess: () => setOpen(false) })
                }
              >
                {del.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Link
              href={`/jobs/${jobId}`}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              View
            </Link>
            <Link
              href={`/company/jobs/${jobId}`}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <SquarePen className="h-4 w-4 text-muted-foreground" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={cn(
                itemClass,
                "text-destructive hover:bg-destructive/10",
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

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

  // Candidate counts live on the inbox rows, not the job; one fetch builds a
  // lookup keyed by job.
  const inbox = useInboxJobs("company", { page: 1, limit: 100 });
  const candidatesByJob = new Map<string, number>(
    (inbox.data?.data ?? []).map((row) => [row.jobId, row.candidateCount]),
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
            options: [...STATUS_FILTER_OPTIONS],
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
        subtitle="Create a job, then publish it to open it to recruiters."
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
                      {cols.isVisible("status") && (
                        <th className={TABLE_TH}>Status</th>
                      )}
                      {cols.isVisible("category") && (
                        <th className={TABLE_TH}>Category</th>
                      )}
                      {cols.isVisible("fee") && (
                        <th className={TABLE_TH}>Recruiter fee</th>
                      )}
                      {cols.isVisible("candidates") && (
                        <th className={TABLE_TH}>Candidates</th>
                      )}
                      <th className={`${TABLE_TH} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY}>
                    {data.data.map((job) => {
                      const candidateCount = candidatesByJob.get(job.id);
                      const dateLabel = formatDate(
                        job.publishedAt ?? job.createdAt,
                      );
                      return (
                        <tr key={job.id} className={TABLE_ROW}>
                          <td className={TABLE_TD}>
                            {/* Title opens the job's public-style detail view;
                                the row's Edit action is where you change it. */}
                            <Link
                              href={`/jobs/${job.id}`}
                              className="font-semibold text-navy transition-colors hover:text-primary"
                            >
                              {job.title}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {dateLabel}
                            </p>
                          </td>
                          {cols.isVisible("status") && (
                            <td className={TABLE_TD}>
                              <StatusBadge
                                label={STATUS_LABELS[job.status] ?? job.status}
                                className={
                                  STATUS_STYLES[job.status] ??
                                  "bg-muted text-muted-foreground"
                                }
                              />
                            </td>
                          )}
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
                          {cols.isVisible("candidates") && (
                            <td className={`${TABLE_TD} tabular-nums`}>
                              {/* Just the total: the untriaged count lives in the
                                  inbox, which is where you act on it, and the
                                  number links straight there. */}
                              {candidateCount !== undefined &&
                              candidateCount > 0 ? (
                                <Link
                                  href={`/company/inbox/job/${job.id}`}
                                  className="inline-flex items-center gap-1.5 transition-colors hover:underline"
                                >
                                  <span className="font-semibold text-navy">
                                    {candidateCount}
                                  </span>
                                </Link>
                              ) : (
                                <span className="text-brand-gray">0</span>
                              )}
                            </td>
                          )}
                          <td className={`${TABLE_TD} text-right`}>
                            <div className="flex justify-end">
                              <JobRowActions jobId={job.id} />
                            </div>
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
