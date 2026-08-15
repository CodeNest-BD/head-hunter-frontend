"use client";

import { useMemo } from "react";
import { Handshake } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { formatMinor } from "@/shared/utils/money";
import { formatDate } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { useCompanyPlacements } from "../hooks/usePlacements";
import {
  COMPANY_PLACEMENT_STATUS_LABELS,
  type CompanyPlacement,
} from "../schemas";
import { DisputeDialog } from "./DisputeDialog";

const STATUS_STYLES: Record<CompanyPlacement["status"], string> = {
  held: "bg-[#FBF3DF] text-[#7A5109]",
  disputed: "bg-[#FBEAEA] text-[#9B3535]",
  releasing: "bg-primary/15 text-primary",
  released: "bg-[#E7F4EC] text-[#17734E]",
  refunded: "bg-muted text-muted-foreground",
};

function useColumns(): ColumnDef<CompanyPlacement, unknown>[] {
  return useMemo(
    () => [
      {
        id: "jobTitle",
        header: "Job",
        size: 240,
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate font-medium text-navy">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        id: "candidate",
        header: "Candidate",
        size: 170,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.candidateName}
          </span>
        ),
      },
      {
        id: "recruiter",
        header: "Recruiter",
        size: 170,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.recruiterName}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Commission",
        size: 130,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium text-navy">
            {formatMinor(row.original.amountMinor)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => (
          <StatusBadge
            label={COMPANY_PLACEMENT_STATUS_LABELS[row.original.status]}
            className={STATUS_STYLES[row.original.status]}
          />
        ),
      },
      {
        id: "holdExpiresAt",
        header: "Releases / released",
        size: 160,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.releasedAt
              ? formatDate(row.original.releasedAt)
              : formatDate(row.original.holdExpiresAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableResizing: false,
        size: 130,
        meta: { align: "center" },
        cell: ({ row }) => {
          const p = row.original;
          return p.canDispute ? (
            <DisputeDialog
              placementId={p.placementId}
              candidateName={p.candidateName}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Dispute
                </Button>
              }
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      },
    ],
    [],
  );
}

/** Every placement funded from this company's wallet, with the dispute window. */
export function CompanyPlacementsTable() {
  const table = useServerTableState({
    defaultSort: [{ id: "createdAt", desc: true }],
  });
  const columns = useColumns();
  const { data, isPending, isError, refetch } = useCompanyPlacements({
    page: table.page,
    limit: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      getRowId={(p) => p.placementId}
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
      emptyIcon={Handshake}
      emptyTitle="No placements yet"
      emptyMessage="A placement appears here when you accept an offer for a submitted candidate."
    />
  );
}
