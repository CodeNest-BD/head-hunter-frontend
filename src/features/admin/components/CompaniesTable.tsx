"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DataTable } from "@/shared/ui-components/data/DataTable";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { useAdminCompanies } from "../hooks/useAdmin";
import type { CompanyListItem } from "../schemas";
import { HoldButton } from "./HoldButton";
import { ListToolbar } from "./ListToolbar";
import { ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_STYLES } from "./statusStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Deep-link to the jobs list filtered to one company. */
function companyJobsHref(
  companyProfileId: string,
  companyName: string,
): string {
  return `/admin/jobs?${new URLSearchParams({ companyProfileId, companyName }).toString()}`;
}

function useColumns(): ColumnDef<CompanyListItem, unknown>[] {
  return useMemo(
    () => [
      {
        id: "companyName",
        header: "Company",
        size: 260,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <Link
                href={`/admin/companies/${c.userId}`}
                className="font-medium text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {c.companyName}
              </Link>
              <p
                className="max-w-[240px] truncate text-xs text-muted-foreground"
                title={c.email}
              >
                {c.email}
              </p>
            </div>
          );
        },
      },
      {
        id: "balance",
        header: "Wallet",
        size: 130,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium text-navy">
            {formatMinor(row.original.balanceMinor)}
          </span>
        ),
      },
      {
        id: "jobs",
        header: "Jobs",
        size: 90,
        cell: ({ row }) => {
          const c = row.original;
          return c.jobCount > 0 ? (
            <Link
              href={companyJobsHref(c.companyProfileId, c.companyName)}
              className="font-medium text-primary tabular-nums hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {c.jobCount}
            </Link>
          ) : (
            <span className="tabular-nums text-muted-foreground">0</span>
          );
        },
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
          const c = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/companies/${c.userId}`}>View</Link>
              </Button>
              <HoldButton
                userId={c.userId}
                status={c.status}
                subjectName={c.companyName}
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

export function CompaniesTable() {
  const table = useServerTableState({
    defaultSort: [{ id: "joinedAt", desc: true }],
  });
  const columns = useColumns();
  const { data, isPending, isError, refetch } = useAdminCompanies({
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
        placeholder="Search companies by name or email…"
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
        getRowId={(c) => c.userId}
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
        emptyIcon={Building2}
        emptyTitle="No companies found"
      />
    </div>
  );
}
