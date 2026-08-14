"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { Button } from "@/shared/ui-components/controls/button";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { useAdminRecruiters } from "../hooks/useAdmin";
import { SUBSCRIPTION_LABELS, type RecruiterListItem } from "../schemas";
import { HoldButton } from "./HoldButton";
import { ListToolbar } from "./ListToolbar";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  SUBSCRIPTION_STATUS_STYLES,
} from "./statusStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function useColumns(): ColumnDef<RecruiterListItem, unknown>[] {
  return useMemo(
    () => [
      {
        id: "name",
        header: "Recruiter",
        size: 240,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <Link
                href={`/admin/recruiters/${r.userId}`}
                className="font-medium text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {r.firstName} {r.lastName}
              </Link>
              <p
                className="max-w-[220px] truncate text-xs text-muted-foreground"
                title={r.email}
              >
                {r.email}
              </p>
            </div>
          );
        },
      },
      {
        id: "subscription",
        header: "Subscription",
        size: 150,
        cell: ({ row }) => (
          <StatusBadge
            label={
              SUBSCRIPTION_LABELS[row.original.subscriptionStatus] ??
              row.original.subscriptionStatus
            }
            className={
              SUBSCRIPTION_STATUS_STYLES[row.original.subscriptionStatus] ??
              "bg-muted text-muted-foreground"
            }
          />
        ),
      },
      {
        id: "location",
        header: "Location",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {[row.original.city, row.original.state]
              .filter(Boolean)
              .join(", ") || "—"}
          </span>
        ),
      },
      {
        id: "joinedAt",
        header: "Joined",
        size: 120,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(row.original.joinedAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 110,
        cell: ({ row }) => (
          <StatusBadge
            label={ACCOUNT_STATUS_LABELS[row.original.status]}
            className={ACCOUNT_STATUS_STYLES[row.original.status]}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableResizing: false,
        size: 150,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/recruiters/${r.userId}`}>View</Link>
              </Button>
              <HoldButton
                userId={r.userId}
                status={r.status}
                subjectName={`${r.firstName} ${r.lastName}`}
                size="sm"
              />
            </div>
          );
        },
      },
    ],
    [],
  );
}

export function RecruitersTable() {
  const table = useServerTableState({
    defaultSort: [{ id: "joinedAt", desc: true }],
  });
  const columns = useColumns();
  const { data, isPending, isError, refetch } = useAdminRecruiters({
    page: table.page,
    limit: table.pageSize,
    q: table.q || undefined,
    status: table.status || undefined,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        query={table.qInput}
        onQueryChange={table.setQInput}
        placeholder="Search recruiters by name or email…"
        filter={{
          value: table.status,
          onChange: table.setStatus,
          allLabel: "All statuses",
          options: [
            { value: "active", label: "Active" },
            { value: "suspended", label: "Held" },
          ],
        }}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        getRowId={(r) => r.userId}
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
        emptyIcon={Users}
        emptyTitle="No recruiters found"
      />
    </div>
  );
}
