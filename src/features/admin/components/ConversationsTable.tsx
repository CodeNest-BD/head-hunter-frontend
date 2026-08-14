"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MessagesSquare, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { useAdminConversations } from "../hooks/useAdmin";
import { SUBMISSION_LABELS, type ConversationListItem } from "../schemas";
import { ListToolbar } from "./ListToolbar";
import { SUBMISSION_STATUS_STYLES } from "./statusStyles";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useColumns(): ColumnDef<ConversationListItem, unknown>[] {
  return useMemo(
    () => [
      {
        id: "companyName",
        header: "Company",
        size: 200,
        cell: ({ row }) => (
          <Link
            href={`/admin/conversations/${row.original.submissionId}`}
            className="font-medium text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {row.original.companyName}
          </Link>
        ),
      },
      {
        id: "recruiterName",
        header: "Recruiter",
        size: 180,
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate text-muted-foreground">
            {row.original.recruiterName}
          </span>
        ),
      },
      {
        id: "jobTitle",
        header: "Job",
        size: 300,
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate text-muted-foreground">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        id: "candidates",
        header: "Candidates",
        size: 120,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="tabular-nums text-navy">
            {row.original.candidateCount}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => (
          <StatusBadge
            label={
              SUBMISSION_LABELS[row.original.status] ?? row.original.status
            }
            className={
              SUBMISSION_STATUS_STYLES[row.original.status] ??
              "bg-muted text-muted-foreground"
            }
          />
        ),
      },
      {
        id: "lastActivityAt",
        header: "Last activity",
        size: 160,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateTime(row.original.lastActivityAt)}
          </span>
        ),
      },
    ],
    [],
  );
}

interface ConversationsTableProps {
  /** When set, the list is restricted to one job's submissions (a deep-link). */
  jobId?: string;
  jobTitle?: string;
}

export function ConversationsTable({
  jobId,
  jobTitle,
}: ConversationsTableProps) {
  const table = useServerTableState({
    defaultSort: [{ id: "lastActivityAt", desc: true }],
  });
  const columns = useColumns();
  const { data, isPending, isError, refetch } = useAdminConversations({
    page: table.page,
    limit: table.pageSize,
    q: table.q || undefined,
    status: table.status || undefined,
    jobId: jobId || undefined,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  return (
    <div className="flex flex-col gap-4">
      {jobId && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 font-medium text-primary">
            Job: {jobTitle || "Selected job"}
            <Link
              href="/admin/conversations"
              aria-label="Clear job filter"
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
        placeholder="Search by job, company or recruiter…"
        filter={{
          value: table.status,
          onChange: table.setStatus,
          allLabel: "All statuses",
          options: [
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Under review" },
            { value: "advanced", label: "Advanced" },
            { value: "rejected", label: "Rejected" },
            { value: "withdrawn", label: "Withdrawn" },
          ],
        }}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        getRowId={(c) => c.submissionId}
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
        emptyIcon={MessagesSquare}
        emptyTitle="No conversations found"
        emptyMessage="Conversations appear once a recruiter submits candidates to a job."
      />
    </div>
  );
}
