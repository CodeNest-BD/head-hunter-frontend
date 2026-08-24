"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Building2 } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableAvatar } from "@/shared/ui-components/data/TableAvatar";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { PageBanner } from "@/shared/ui-components/brand";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminCompanies, useAdminStats } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { VERIFICATION_LABELS } from "../schemas";
import { AccountRowActions } from "./AccountRowActions";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  VERIFICATION_STATUS_STYLES,
} from "./statusStyles";
import { BODY_ROW_CLASS, TABLE_CLASS, THEAD_ROW_CLASS } from "./tableStyles";
import { TABLE_TOOLBAR } from "@/shared/ui-components/data/tableStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const COLUMNS: ColumnDef[] = [
  { key: "company", label: "Company", required: true },
  { key: "wallet", label: "Wallet" },
  { key: "jobs", label: "Jobs" },
  { key: "joined", label: "Joined" },
  { key: "approval", label: "Approval" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", required: true },
];

/** Deep-link to the jobs list filtered to one company. */
function companyJobsHref(
  companyProfileId: string,
  companyName: string,
): string {
  const params = new URLSearchParams({
    companyProfileId,
    companyName,
  });
  return `/admin/jobs?${params.toString()}`;
}

export function CompaniesTable() {
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
  const [verificationFilter, setVerificationFilter] = useState("");
  const cols = useVisibleColumns("admin.companies.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminCompanies({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    verificationStatus: verificationFilter || undefined,
  });
  const pendingTotal =
    useAdminCompanies({ page: 1, verificationStatus: "pending", limit: 1 }).data
      ?.meta.total ?? 0;

  const stats = useAdminStats();
  const allCompanies = useAdminCompanies({ page: 1, limit: 100 });
  const fundedCount = (allCompanies.data?.data ?? []).filter(
    (c) => c.balanceMinor > 0,
  ).length;
  const postedCount = (allCompanies.data?.data ?? []).filter(
    (c) => c.jobCount > 0,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Companies"
        subtitle="Every company on the platform, their wallet, and account controls."
        metrics={[
          { label: "Awaiting approval", value: pendingTotal },
          { label: "Funded wallets", value: fundedCount },
          { label: "Posted a job", value: postedCount },
          { label: "Held", value: stats.data?.companies.held ?? 0 },
        ]}
      />

      <div className="flex flex-col gap-4">
        <div className={TABLE_TOOLBAR}>
          <div className="flex-1">
            <ListToolbar
              query={qInput}
              onQueryChange={setQInput}
              placeholder="Search companies by name or email…"
              filter={{
                value: status,
                onChange: changeStatus,
                allLabel: "All statuses",
                options: [
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Held" },
                ],
              }}
              extraFilter={{
                value: verificationFilter,
                onChange: (next) => {
                  setVerificationFilter(next);
                  setPage(1);
                },
                allLabel: "All approvals",
                options: [
                  { value: "pending", label: "Pending" },
                  { value: "verified", label: "Approved" },
                  { value: "rejected", label: "Declined" },
                ],
              }}
            />
          </div>
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>

        {isPending ? (
          <TableSkeleton />
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
              <AlertCircle className="h-6 w-6" />
              Could not load companies.
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : data.data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                <Building2 className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-navy">
                No companies found
              </p>
              <p className="text-sm text-muted-foreground">
                Try a different search or filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="w-full">
                <table className={TABLE_CLASS}>
                  <thead>
                    <tr className={THEAD_ROW_CLASS}>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Company
                      </th>
                      {cols.isVisible("wallet") && (
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-semibold"
                        >
                          Wallet
                        </th>
                      )}
                      {cols.isVisible("jobs") && (
                        <th
                          scope="col"
                          className="px-5 py-3 text-center font-semibold"
                        >
                          Jobs
                        </th>
                      )}
                      {cols.isVisible("joined") && (
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Joined
                        </th>
                      )}
                      {cols.isVisible("approval") && (
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Approval
                        </th>
                      )}
                      {cols.isVisible("status") && (
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Status
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-semibold"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((c) => (
                      <tr key={c.userId} className={BODY_ROW_CLASS}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <TableAvatar name={c.companyName} />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/companies/${c.userId}`}
                                className="font-semibold text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
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
                          </div>
                        </td>
                        {cols.isVisible("wallet") && (
                          <td
                            className={cn(
                              "whitespace-nowrap px-5 py-3 text-right tabular-nums",
                              c.balanceMinor > 0
                                ? "font-bold text-navy"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatMinor(c.balanceMinor)}
                          </td>
                        )}
                        {cols.isVisible("jobs") && (
                          <td className="px-5 py-3 text-center tabular-nums">
                            {c.jobCount > 0 ? (
                              <Link
                                href={companyJobsHref(
                                  c.companyProfileId,
                                  c.companyName,
                                )}
                                className="font-medium text-primary hover:underline focus-visible:underline focus-visible:outline-none"
                              >
                                {c.jobCount}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                        )}
                        {cols.isVisible("joined") && (
                          <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                            {formatDate(c.joinedAt)}
                          </td>
                        )}
                        {cols.isVisible("approval") && (
                          <td className="px-5 py-3">
                            <StatusBadge
                              label={VERIFICATION_LABELS[c.verificationStatus]}
                              className={
                                VERIFICATION_STATUS_STYLES[
                                  c.verificationStatus
                                ] ?? "bg-muted text-muted-foreground"
                              }
                            />
                          </td>
                        )}
                        {cols.isVisible("status") && (
                          <td className="px-5 py-3">
                            <StatusBadge
                              label={ACCOUNT_STATUS_LABELS[c.status]}
                              className={ACCOUNT_STATUS_STYLES[c.status]}
                            />
                          </td>
                        )}
                        <td className="px-5 py-3">
                          <AccountRowActions
                            userId={c.userId}
                            status={c.status}
                            subjectName={c.companyName}
                            viewHref={`/admin/companies/${c.userId}`}
                            kind="company"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ListPager
                page={page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                onPage={setPage}
                pageSize={limit}
                onPageSize={changeLimit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
