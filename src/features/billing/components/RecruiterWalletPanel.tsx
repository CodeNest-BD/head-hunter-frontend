"use client";

import { useMemo } from "react";
import { AlertCircle, Wallet2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  useRecruiterPlacements,
  useRecruiterWallet,
} from "../hooks/useBilling";
import {
  PLACEMENT_STATUS_LABELS,
  type PlacementStatus,
  type RecruiterPlacement,
  type RecruiterWalletSummary,
} from "../schemas";

const STATUS_STYLES: Record<PlacementStatus, string> = {
  released: "bg-[#E7F4EC] text-[#17734E]",
  held: "bg-[#FBF3DF] text-[#7A5109]",
  releasing: "bg-primary/15 text-primary",
  disputed: "bg-[#FBEAEA] text-[#9B3535]",
  refunded: "bg-muted text-muted-foreground",
};

function Metric({
  label,
  valueMinor,
  hint,
  primary = false,
}: {
  label: string;
  valueMinor: number | undefined;
  hint: string;
  primary?: boolean;
}) {
  return (
    <div className="flex-1 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-heading font-extrabold leading-none text-navy",
          primary ? "text-4xl text-primary" : "text-[26px]",
        )}
      >
        {valueMinor === undefined ? "—" : formatMinor(valueMinor)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function WalletSummaryCard({ data }: { data?: RecruiterWalletSummary }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col divide-y divide-border p-0 sm:flex-row sm:divide-x sm:divide-y-0">
        <Metric
          label="Total balance"
          valueMinor={data?.totalMinor}
          hint="Everything you've earned so far"
          primary
        />
        <Metric
          label="In escrow"
          valueMinor={data?.inEscrowMinor}
          hint={
            data?.nextReleaseAt
              ? `Next release ${formatDate(data.nextReleaseAt)}`
              : "Awaiting the 30-day release"
          }
        />
        <Metric
          label="In dispute"
          valueMinor={data?.inDisputeMinor}
          hint="Held pending a dispute"
        />
      </CardContent>
    </Card>
  );
}

function usePlacementColumns(): ColumnDef<RecruiterPlacement, unknown>[] {
  return useMemo(
    () => [
      {
        id: "company",
        header: "Company",
        size: 180,
        cell: ({ row }) => (
          <span className="font-medium text-navy">
            {row.original.companyName}
          </span>
        ),
      },
      {
        id: "role",
        header: "Role",
        size: 260,
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        id: "candidate",
        header: "Candidate",
        size: 160,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.candidateName}
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
            label={
              PLACEMENT_STATUS_LABELS[row.original.status] ??
              row.original.status
            }
            className={
              STATUS_STYLES[row.original.status] ??
              "bg-muted text-muted-foreground"
            }
          />
        ),
      },
      {
        id: "releaseDate",
        header: "Released / hold ends",
        enableSorting: false,
        size: 160,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.releasedAt
              ? formatDate(row.original.releasedAt)
              : formatDate(row.original.holdExpiresAt)}
          </span>
        ),
      },
    ],
    [],
  );
}

function PlacementsTable() {
  const table = useServerTableState({
    defaultSort: [{ id: "createdAt", desc: true }],
  });
  const columns = usePlacementColumns();
  const { data, isPending, isError, refetch } = useRecruiterPlacements({
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
      emptyIcon={Wallet2}
      emptyTitle="No placements yet"
      emptyMessage="Your commission appears here once a candidate you placed is hired."
    />
  );
}

/** Recruiter earnings: escrow summary + placement history. */
export function RecruiterWalletPanel() {
  const { data, isError, refetch } = useRecruiterWallet();

  return (
    <div className="flex flex-col gap-8">
      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            Could not load your earnings.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <WalletSummaryCard data={data} />
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-navy">Placements</h2>
        <PlacementsTable />
      </section>
    </div>
  );
}
