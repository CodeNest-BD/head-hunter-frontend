"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Building2 } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { TableFilterBar } from "@/shared/ui-components/data/TableFilterBar";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { PageHeader } from "@/shared/ui-components/brand";
import {
  MobileRecordCard,
  MobileRecordList,
  type MobileRecordField,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { cn } from "@/shared/libs/shadCnConfig";
import { adminCompanyPath, urlRef } from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { useAdminCompanies, useAdminStats } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { VERIFICATION_LABELS, type CompanyListItem } from "../schemas";
import { AccountRowActions } from "./AccountRowActions";
import { ListPager } from "./ListPager";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  VERIFICATION_STATUS_TONES,
} from "./statusStyles";
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
} from "@/shared/ui-components/data/tableStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const;

const APPROVAL_FILTER_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Approved" },
  { value: "rejected", label: "Declined" },
] as const;

/** Deep-link to the jobs list filtered to one company. */
function companyJobsHref(company: CompanyListItem): string {
  const params = new URLSearchParams({
    company: urlRef({
      id: company.companyProfileId,
      serialNumber: company.companySerialNumber,
    }),
    companyName: company.companyName,
  });
  return `/admin/jobs?${params.toString()}`;
}

const companyDetailHref = (company: CompanyListItem): string =>
  adminCompanyPath({
    id: company.userId,
    serialNumber: company.companySerialNumber,
  });

/**
 * Money ink: a funded wallet reads as a figure that matters, an unfunded one
 * stays faint — the reference treats $0 as a normal early state, not an error.
 */
function walletToneClass(balanceMinor: number): string {
  return balanceMinor > 0 ? "font-[650] text-ink" : "text-ink-faint";
}

function CompanyJobCount({ company }: { company: CompanyListItem }) {
  return company.jobCount > 0 ? (
    <Link
      href={companyJobsHref(company)}
      className="font-[550] tabular-nums text-blue-ink hover:underline focus-visible:underline focus-visible:outline-none"
    >
      {company.jobCount}
    </Link>
  ) : (
    <span className="tabular-nums text-ink-faint">0</span>
  );
}

function CompanyApproval({ company }: { company: CompanyListItem }) {
  return (
    <StatusBadge
      label={VERIFICATION_LABELS[company.verificationStatus]}
      tone={VERIFICATION_STATUS_TONES[company.verificationStatus] ?? "neutral"}
    />
  );
}

function CompanyStatus({ company }: { company: CompanyListItem }) {
  return (
    <StatusBadge
      label={ACCOUNT_STATUS_LABELS[company.status]}
      tone={ACCOUNT_STATUS_TONES[company.status]}
    />
  );
}

function CompanyCard({ company }: { company: CompanyListItem }) {
  const fields: MobileRecordField[] = [
    {
      label: "Wallet",
      value: (
        <span
          className={cn("tabular-nums", walletToneClass(company.balanceMinor))}
        >
          {formatMinor(company.balanceMinor)}
        </span>
      ),
    },
    { label: "Jobs", value: <CompanyJobCount company={company} /> },
    { label: "Joined", value: formatDate(company.joinedAt) },
    { label: "Approval", value: <CompanyApproval company={company} /> },
    {
      label: "Avg fee",
      value:
        company.avgFeeMinor === null ? "—" : formatMinor(company.avgFeeMinor),
    },
  ];

  return (
    <MobileRecordCard
      title={company.companyName}
      subtitle={company.email}
      href={companyDetailHref(company)}
      trailing={<CompanyStatus company={company} />}
      fields={fields}
      actions={
        <AccountRowActions
          userId={company.userId}
          status={company.status}
          subjectName={company.companyName}
          viewHref={companyDetailHref(company)}
          kind="company"
        />
      }
    />
  );
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
  // Drives the filter bar's Clear, and the way back out of an empty list.
  const hasFilters =
    qInput !== "" || status !== "" || verificationFilter !== "";
  const resetFilters = () => {
    setQInput("");
    changeStatus("");
    setVerificationFilter("");
    setPage(1);
  };
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
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Companies"
        subtitle="Every company on the platform, their wallet, and account controls."
        metrics={[
          { label: "Pending Approval", value: pendingTotal, tone: "warn" },
          { label: "Total", value: stats.data?.companies.approved ?? 0 },
          { label: "Funded Wallets", value: fundedCount, tone: "ok" },
          { label: "Posted a Job", value: postedCount, tone: "info" },
          {
            label: "Suspended",
            value: stats.data?.companies.held ?? 0,
            tone: "bad",
          },
        ]}
      />

      <TableFilterBar
        filters={[
          {
            kind: "search",
            key: "q",
            label: "Search companies",
            placeholder: "Search companies by name or email…",
            value: qInput,
            onChange: setQInput,
          },
          {
            kind: "select",
            key: "status",
            label: "Status",
            options: STATUS_FILTER_OPTIONS,
            value: status,
            onChange: changeStatus,
          },
          {
            kind: "select",
            key: "approval",
            label: "Approval",
            options: APPROVAL_FILTER_OPTIONS,
            value: verificationFilter,
            onChange: (next) => {
              setVerificationFilter(next);
              setPage(1);
            },
          },
        ]}
        onClearFilters={resetFilters}
      />

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load companies.
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data.data.length === 0 ? (
        <div className={TABLE_CARD}>
          <EmptyState
            icon={Building2}
            title="No companies found"
            description="Try a different search or filter."
            action={
              hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Reset filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className={TABLE_CARD}>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={cn(TABLE_TH, "w-[26%]")}>
                      Company
                    </th>
                    <th scope="col" className={cn(TABLE_TH, "text-right")}>
                      Wallet
                    </th>
                    <th scope="col" className={cn(TABLE_TH, "text-center")}>
                      Jobs
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Joined
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Approval
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Status
                    </th>
                    <th scope="col" className={cn(TABLE_TH, "text-right")}>
                      Avg fee
                    </th>
                    <th scope="col" className={cn(TABLE_TH, "w-11 text-right")}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {data.data.map((c) => (
                    <tr key={c.userId} className={TABLE_ROW}>
                      <td className={TABLE_TD_STACKED}>
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo
                            companyProfileId={c.companyProfileId}
                            hasLogo={c.hasLogo}
                            name={c.companyName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              href={companyDetailHref(c)}
                              className={cn(
                                TABLE_CELL_MAIN,
                                "transition-colors hover:text-blue focus-visible:underline focus-visible:outline-none",
                              )}
                            >
                              {c.companyName}
                            </Link>
                            <p
                              className={cn(
                                TABLE_CELL_SUB,
                                "max-w-[240px] truncate",
                              )}
                              title={c.email}
                            >
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap text-right tabular-nums",
                          walletToneClass(c.balanceMinor),
                        )}
                      >
                        {formatMinor(c.balanceMinor)}
                      </td>
                      <td className={cn(TABLE_TD, "text-center")}>
                        <CompanyJobCount company={c} />
                      </td>
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap tabular-nums text-ink-muted",
                        )}
                      >
                        {formatDate(c.joinedAt)}
                      </td>
                      <td className={TABLE_TD}>
                        <CompanyApproval company={c} />
                      </td>
                      <td className={TABLE_TD}>
                        <CompanyStatus company={c} />
                      </td>
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap text-right tabular-nums text-ink-muted",
                        )}
                      >
                        {c.avgFeeMinor === null
                          ? "—"
                          : formatMinor(c.avgFeeMinor)}
                      </td>
                      <td className={cn(TABLE_TD, "text-right")}>
                        <AccountRowActions
                          userId={c.userId}
                          status={c.status}
                          subjectName={c.companyName}
                          viewHref={companyDetailHref(c)}
                          kind="company"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MobileRecordList className="sm:hidden">
              {data.data.map((c) => (
                <CompanyCard key={c.userId} company={c} />
              ))}
            </MobileRecordList>
          </div>
          <ListPager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPage={setPage}
            pageSize={limit}
            onPageSize={changeLimit}
          />
        </>
      )}
    </div>
  );
}
