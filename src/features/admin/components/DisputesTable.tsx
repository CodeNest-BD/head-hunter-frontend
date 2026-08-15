"use client";

import { useMemo } from "react";
import { Scale } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { useAdminDisputes } from "../hooks/useAdmin";
import {
  DISPUTE_STATUS_LABELS,
  type AdminDispute,
  type DisputeStatus,
} from "../schemas";
import { ResolveDisputeDialog } from "./ResolveDisputeDialog";

const STATUS_STYLES: Record<DisputeStatus, string> = {
  open: "bg-[#FBEAEA] text-[#9B3535]",
  under_review: "bg-[#FBF3DF] text-[#7A5109]",
  resolved_release: "bg-[#E7F4EC] text-[#17734E]",
  resolved_refund: "bg-primary/15 text-primary",
  resolved_split: "bg-primary/15 text-primary",
  unknown: "bg-muted text-muted-foreground",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function useColumns(): ColumnDef<AdminDispute, unknown>[] {
  return useMemo(
    () => [
      {
        id: "companyName",
        header: "Company",
        size: 190,
        cell: ({ row }) => (
          <div>
            <span className="block max-w-[180px] truncate font-medium text-navy">
              {row.original.companyName}
            </span>
            <span className="block max-w-[180px] truncate text-xs text-muted-foreground">
              vs {row.original.recruiterName}
            </span>
          </div>
        ),
      },
      {
        id: "jobTitle",
        header: "Job",
        size: 200,
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        enableSorting: false,
        size: 240,
        cell: ({ row }) => (
          <span
            className="block max-w-[240px] truncate text-muted-foreground"
            title={row.original.reason}
          >
            {row.original.reason}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Escrowed",
        size: 120,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium text-navy">
            {formatMinor(row.original.amountMinor)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => (
          <div>
            <StatusBadge
              label={
                DISPUTE_STATUS_LABELS[row.original.status] ??
                row.original.status
              }
              className={
                STATUS_STYLES[row.original.status] ??
                "bg-muted text-muted-foreground"
              }
            />
            {row.original.status === "resolved_split" &&
              row.original.recruiterAwardMinor !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMinor(row.original.recruiterAwardMinor)} to recruiter
                </p>
              )}
          </div>
        ),
      },
      {
        id: "createdAt",
        header: "Opened",
        size: 120,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableResizing: false,
        size: 120,
        meta: { align: "center" },
        cell: ({ row }) => {
          const d = row.original;
          const open = d.status === "open" || d.status === "under_review";
          return open ? (
            <ResolveDisputeDialog
              dispute={d}
              trigger={
                <Button type="button" size="sm">
                  Resolve
                </Button>
              }
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {d.resolvedAt ? formatDate(d.resolvedAt) : "—"}
            </span>
          );
        },
      },
    ],
    [],
  );
}

export function DisputesTable() {
  const table = useServerTableState({
    defaultSort: [{ id: "createdAt", desc: true }],
  });
  const columns = useColumns();
  const { data, isPending, isError, refetch } = useAdminDisputes({
    page: table.page,
    limit: table.pageSize,
    status: table.status || undefined,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  // Radix Select forbids empty item values; "all" maps to no filter.
  const ALL = "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Select
          value={table.status === "" ? ALL : table.status}
          onValueChange={(next) => table.setStatus(next === ALL ? "" : next)}
        >
          <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label="Filter disputes"
          >
            <SelectValue placeholder="All disputes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All disputes</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        getRowId={(d) => d.disputeId}
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
        emptyIcon={Scale}
        emptyTitle="No disputes"
        emptyMessage="Disputes appear when a company contests a placement during the 30-day hold."
      />
    </div>
  );
}
