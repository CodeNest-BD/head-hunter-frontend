"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Eye,
  Lock,
  MoreHorizontal,
  Plus,
  SquarePen,
  Trash2,
  TriangleAlert,
} from "lucide-react";

// Deep-imported (not via the feature barrels): JobsTable is exported from the
// jobs barrel, and the inbox barrel imports back from jobs — the barrel
// paths would close an import cycle.
import { useWallet } from "@/features/billing/hooks/useBilling";
import { useInboxJobs } from "@/features/inbox/hooks/useInbox";
import { HIDE_PHASE2_FEATURES } from "@/shared/config/featureFlags";
import { PageHeader } from "@/shared/ui-components/brand";
import { Pill, type PillTone } from "@/shared/ui-components/badges/Pill";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
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
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
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
  type Job,
  type RoleCategory,
} from "../schemas";
import { useDeleteJob, useJobs } from "../hooks/useJobs";
import { jobPath } from "../utils/jobPath";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  filled: "Filled",
  closed: "Closed",
  expired: "Expired",
};

/** Per-status pill tone for the Status column (mirrors the job detail page). */
const STATUS_TONES: Record<string, PillTone> = {
  draft: "neutral",
  published: "ok",
  expired: "bad",
  paused: "warn",
  filled: "info",
  closed: "bad",
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
  { key: "expiry", label: "Expiry" },
  // Candidates access is phase-2 — hidden for the phase-1 delivery.
  ...(HIDE_PHASE2_FEATURES ? [] : [{ key: "candidates", label: "Candidates" }]),
  { key: "actions", label: "Actions", required: true },
];

const CATEGORY_OPTIONS = (
  Object.entries(ROLE_CATEGORY_LABELS) as [RoleCategory, string][]
).map(([value, label]) => ({ value, label }));

// The four value cells below are rendered by both the desktop table and the
// mobile card, so they live here rather than inline in either one.

function JobStatusBadge({ status }: { status: Job["status"] }) {
  return (
    <StatusBadge
      label={STATUS_LABELS[status] ?? status}
      tone={STATUS_TONES[status] ?? "neutral"}
    />
  );
}

/**
 * The reference reads a fee as money — tabular, full-strength ink — and flips a
 * fee of nothing into a plain amber pill, because a zero here is a problem to
 * fix rather than an amount to compare.
 */
function RecruiterFee({ feeMinor }: { feeMinor: number }) {
  return feeMinor === 0 ? (
    <Pill tone="warn" plain>
      $0
    </Pill>
  ) : (
    <span className="font-[650] tabular-nums text-ink">
      {formatMinor(feeMinor)}
    </span>
  );
}

function JobExpiry({ expiresAt }: { expiresAt: Job["expiresAt"] }) {
  return expiresAt ? (
    <span className="tabular-nums">{formatDate(expiresAt)}</span>
  ) : (
    <>—</>
  );
}

/**
 * Just the total: the untriaged count lives in the inbox, which is where you
 * act on it, and the number links straight there.
 */
function CandidateCount({
  jobId,
  count,
}: {
  jobId: string;
  count: number | undefined;
}) {
  return count !== undefined && count > 0 ? (
    <Link
      href={`/company/inbox/job/${jobId}`}
      className="font-[550] tabular-nums text-blue-ink transition-colors hover:underline"
    >
      {count}
    </Link>
  ) : (
    <span className="tabular-nums text-ink-faint">0</span>
  );
}

/**
 * Per-row actions behind a kebab menu: View (the public-style detail), Edit,
 * and a two-step Delete (soft-delete) so the destructive action needs a
 * deliberate confirm.
 */
function JobRowActions({ jobId, title }: { jobId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteJob();

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-sub text-ink-body transition-colors hover:bg-surface-sub hover:text-ink";

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
          className="inline-flex size-7 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <MoreHorizontal className="size-[17px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {confirming ? (
          <div className="p-2">
            <p className="mb-2.5 text-meta text-ink-muted">
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
              href={jobPath({ id: jobId, title })}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Eye className="size-[15px] text-ink-faint" />
              View
            </Link>
            <Link
              href={`/company/jobs/${jobId}`}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <SquarePen className="size-[15px] text-ink-faint" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={cn(
                itemClass,
                "text-bad hover:bg-bad-bg hover:text-bad",
              )}
            >
              <Trash2 className="size-[15px]" />
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
  // The fee notice sits above the toolbar, as the reference places it, but it
  // still only accompanies a populated table — a filtered search that matches
  // nothing should not start surfacing it.
  const hasRows = (data?.data.length ?? 0) > 0;

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
      <div className="sm:ml-auto">
        <ColumnsToggle
          columns={cols.columns}
          isVisible={cols.isVisible}
          onToggle={cols.toggle}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Jobs"
        subtitle="Create a job, then publish it to open it to recruiters."
      />

      {/* The reference's 3-up stat strip: the same three readouts the header
          used to carry, given the room their figures deserve. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Published" value={publishedTotal} icon={Briefcase} />
        <StatCard
          label="No fee set"
          value={
            <span className={noFeeCount > 0 ? "text-warn" : undefined}>
              {noFeeCount}
            </span>
          }
          icon={TriangleAlert}
        />
        <StatCard
          label="Held in escrow"
          value={formatMinor(wallet.data?.reservedMinor)}
          icon={Lock}
        />
      </div>

      {noFeeCount > 0 && hasRows && (
        <Alert tone="warn">
          {noFeeCount} published job{noFeeCount === 1 ? "" : "s"} have no
          recruiter fee. Recruiters sort by fee, so these rank last.
        </Alert>
      )}

      {toolbar}

      {isError ? (
        <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load jobs.
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : isPending ? (
        <TableSkeleton />
      ) : data.data.length === 0 ? (
        <div className={TABLE_CARD}>
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description="Try a different search or filter, or post a new role."
            action={
              <Button asChild type="button">
                <Link href="/company/jobs/new">
                  <Plus />
                  New job
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={cn(TABLE_TH, "w-[32%]")}>Title</th>
                  {cols.isVisible("status") && (
                    <th className={TABLE_TH}>Status</th>
                  )}
                  {cols.isVisible("category") && (
                    <th className={TABLE_TH}>Category</th>
                  )}
                  {cols.isVisible("fee") && (
                    <th className={cn(TABLE_TH, "text-right")}>
                      Recruiter fee
                    </th>
                  )}
                  {cols.isVisible("expiry") && (
                    <th className={TABLE_TH}>Expiry</th>
                  )}
                  {!HIDE_PHASE2_FEATURES && cols.isVisible("candidates") && (
                    <th className={cn(TABLE_TH, "text-center")}>Candidates</th>
                  )}
                  <th className={cn(TABLE_TH, "w-11 text-right")}>Actions</th>
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
                      <td className={TABLE_TD_STACKED}>
                        {/* Title opens the job's public-style detail view;
                            the row's Edit action is where you change it. */}
                        <Link
                          href={jobPath(job)}
                          className={cn(
                            TABLE_CELL_MAIN,
                            "transition-colors hover:text-blue",
                          )}
                        >
                          {job.title}
                        </Link>
                        <p className={TABLE_CELL_SUB}>{dateLabel}</p>
                      </td>
                      {cols.isVisible("status") && (
                        <td className={TABLE_TD}>
                          <JobStatusBadge status={job.status} />
                        </td>
                      )}
                      {cols.isVisible("category") && (
                        <td className={cn(TABLE_TD, "text-ink-muted")}>
                          {ROLE_CATEGORY_LABELS[job.roleCategory]}
                        </td>
                      )}
                      {cols.isVisible("fee") && (
                        <td className={cn(TABLE_TD, "text-right")}>
                          <RecruiterFee feeMinor={job.recruiterFeeMinor} />
                        </td>
                      )}
                      {cols.isVisible("expiry") && (
                        <td className={cn(TABLE_TD, "text-ink-muted")}>
                          <JobExpiry expiresAt={job.expiresAt} />
                        </td>
                      )}
                      {!HIDE_PHASE2_FEATURES &&
                        cols.isVisible("candidates") && (
                          <td className={cn(TABLE_TD, "text-center")}>
                            <CandidateCount
                              jobId={job.id}
                              count={candidateCount}
                            />
                          </td>
                        )}
                      <td className={cn(TABLE_TD, "text-right")}>
                        <div className="flex justify-end">
                          <JobRowActions jobId={job.id} title={job.title} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MobileRecordList className="sm:hidden">
            {data.data.map((job) => (
              <MobileRecordCard
                key={job.id}
                href={jobPath(job)}
                title={job.title}
                subtitle={formatDate(job.publishedAt ?? job.createdAt)}
                trailing={<JobStatusBadge status={job.status} />}
                fields={[
                  {
                    label: "Category",
                    value: ROLE_CATEGORY_LABELS[job.roleCategory],
                  },
                  {
                    label: "Recruiter fee",
                    value: <RecruiterFee feeMinor={job.recruiterFeeMinor} />,
                  },
                  {
                    label: "Expiry",
                    value: <JobExpiry expiresAt={job.expiresAt} />,
                  },
                  ...(HIDE_PHASE2_FEATURES
                    ? []
                    : [
                        {
                          label: "Candidates",
                          value: (
                            <CandidateCount
                              jobId={job.id}
                              count={candidatesByJob.get(job.id)}
                            />
                          ),
                        },
                      ]),
                ]}
                actions={<JobRowActions jobId={job.id} title={job.title} />}
              />
            ))}
          </MobileRecordList>
          <TablePager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={limit}
            onPage={setPage}
            onPageSize={changeLimit}
          />
        </div>
      )}
    </div>
  );
}
