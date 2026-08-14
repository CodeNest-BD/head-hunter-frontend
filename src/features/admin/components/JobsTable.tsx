"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Briefcase, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { formatMinor } from "@/shared/utils/money";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { useAdminJobs } from "../hooks/useAdmin";
import { JOB_STATUS_LABELS, type AdminJobListItem } from "../schemas";
import { ListToolbar } from "./ListToolbar";
import { JOB_STATUS_STYLES } from "./statusStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Deep-link to the submissions (conversations) for one job. */
function jobConversationsHref(jobId: string, jobTitle: string): string {
  return `/admin/conversations?${new URLSearchParams({ jobId, jobTitle }).toString()}`;
}

function useColumns(): ColumnDef<AdminJobListItem, unknown>[] {
  return useMemo(
    () => [
      {
        id: "title",
        header: "Job",
        size: 260,
        cell: ({ row }) => (
          <div>
            <span className="block max-w-[240px] truncate font-medium text-navy">
              {row.original.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.locationState || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "company",
        header: "Company",
        size: 200,
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            {row.original.companyName}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => (
          <StatusBadge
            label={
              JOB_STATUS_LABELS[row.original.status] ?? row.original.status
            }
            className={
              JOB_STATUS_STYLES[row.original.status] ??
              "bg-muted text-muted-foreground"
            }
          />
        ),
      },
      {
        id: "fee",
        header: "Recruiter fee",
        size: 130,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium text-navy">
            {formatMinor(row.original.recruiterFeeMinor)}
          </span>
        ),
      },
      {
        id: "submissions",
        header: "Submissions",
        size: 120,
        cell: ({ row }) => {
          const job = row.original;
          return job.submissionCount > 0 ? (
            <Link
              href={jobConversationsHref(job.jobId, job.title)}
              className="font-medium text-primary tabular-nums hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {job.submissionCount}
            </Link>
          ) : (
            <span className="tabular-nums text-muted-foreground">0</span>
          );
        },
      },
      {
        id: "createdAt",
        header: "Posted",
        size: 120,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );
}

interface JobsTableProps {
  companyProfileId?: string;
  companyName?: string;
  initialStatus?: string;
}

export function JobsTable({
  companyProfileId,
  companyName,
  initialStatus = "",
}: JobsTableProps) {
  const table = useServerTableState({
    defaultSort: [{ id: "createdAt", desc: true }],
    initialStatus,
  });
  const columns = useColumns();
  const { data, isPending, isError, refetch } = useAdminJobs({
    page: table.page,
    limit: table.pageSize,
    q: table.q || undefined,
    status: table.status || undefined,
    companyProfileId: companyProfileId || undefined,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  return (
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
      <ListToolbar
        query={table.qInput}
        onQueryChange={table.setQInput}
        placeholder="Search jobs by title…"
        filter={{
          value: table.status,
          onChange: table.setStatus,
          allLabel: "All statuses",
          options: [
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "paused", label: "Paused" },
            { value: "filled", label: "Filled" },
            { value: "closed", label: "Closed" },
          ],
        }}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        getRowId={(j) => j.jobId}
        page={table.page}
        pageSize={table.pageSize}
        pageCount={data?.meta.totalPages ?? 0}
        total={data?.meta.total ?? 0}
        onPage={table.setPage}
        onPageSize={table.setPageSize}
        sorting={table.sorting}
        onSortingChange={table.setSorting}
        isLoading={isPending}
        isError={isError}
        onRetry={() => void refetch()}
        emptyIcon={Briefcase}
        emptyTitle="No jobs found"
      />
    </div>
  );
}
