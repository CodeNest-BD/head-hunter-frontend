"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Building2 } from "lucide-react";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  ToolbarSearch,
  ToolbarSelect,
} from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
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
import {
  useAdminCompanies,
  useAdminStats,
  useCompanyIndustries,
} from "../hooks/useAdmin";
import {
  QuickViewBand,
  StatValueSkeleton,
  type QuickView,
} from "@/shared/ui-components/dashboard/DashboardParts";
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
  TABLE_TOOLBAR,
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
  { value: "pending", label: "Pending approval" },
  { value: "verified", label: "Approved" },
  { value: "rejected", label: "Declined" },
] as const;

/** The two states `AdminCompaniesQueryDto.wallet` accepts. */
const WALLET_FILTER_OPTIONS = [
  { value: "funded", label: "Funded" },
  { value: "empty", label: "Empty" },
] as const;

const COLUMNS: ColumnDef[] = [
  { key: "company", label: "Company", required: true },
  { key: "approval", label: "Approval" },
  { key: "status", label: "Account" },
  { key: "jobs", label: "Jobs" },
  { key: "avgFee", label: "Avg. Fee" },
  { key: "joined", label: "Joined" },
  { key: "wallet", label: "Wallet" },
  { key: "actions", label: "Actions", required: true },
];

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
  const [walletFilter, setWalletFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const hasFilters =
    qInput !== "" ||
    status !== "" ||
    verificationFilter !== "" ||
    walletFilter !== "" ||
    industryFilter !== "";
  const resetFilters = () => {
    setQInput("");
    changeStatus("");
    setVerificationFilter("");
    setWalletFilter("");
    setIndustryFilter("");
    setPage(1);
  };
  const applyFilter = (set: (next: string) => void) => (next: string) => {
    set(next);
    setPage(1);
  };
  const cols = useVisibleColumns("admin.companies.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminCompanies({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    verificationStatus: verificationFilter || undefined,
    wallet: walletFilter || undefined,
    industry: industryFilter || undefined,
  });

  const stats = useAdminStats();
  const industries = useCompanyIndustries();
  // An exact count rather than a tally of the first page — the old reading
  // counted only the 100 rows it happened to have fetched.
  const fundedTotal = useAdminCompanies({ page: 1, wallet: "funded", limit: 1 })
    .data?.meta.total;

  const quickFilter = (approval: string, account: string, wallet: string) => {
    const active =
      verificationFilter === approval &&
      status === account &&
      walletFilter === wallet;
    return {
      active,
      apply: () => {
        setVerificationFilter(active ? "" : approval);
        setWalletFilter(active ? "" : wallet);
        changeStatus(active ? "" : account);
      },
    };
  };

  const counts = stats.data?.companies;
  const figure = (value: number | undefined) =>
    value === undefined ? <StatValueSkeleton /> : value.toLocaleString();

  const quickViews: readonly QuickView[] = [
    {
      key: "pending",
      label: "Pending Approval",
      value: figure(counts?.pending),
      note: "Awaiting review",
      tone: "warn",
      filter: quickFilter("pending", "", ""),
    },
    {
      key: "approved",
      label: "Approved & Active",
      value: figure(counts?.approved),
      note: "Can post and fund jobs",
      tone: "ok",
      filter: quickFilter("verified", "active", ""),
    },
    {
      key: "funded",
      label: "Funded Wallets",
      value: figure(fundedTotal),
      note: "Balance above $0",
      tone: "info",
      filter: quickFilter("", "", "funded"),
    },
    {
      key: "suspended",
      label: "Suspended",
      value: figure(counts?.held),
      note: "Access blocked",
      tone: "bad",
      filter: quickFilter("", "suspended", ""),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Companies"
        subtitle="Approve new companies and monitor wallets and hiring activity."
      />

      <QuickViewBand label="Company quick views" views={quickViews} />

      <div className={TABLE_CARD}>
        <div className={TABLE_TOOLBAR}>
          <ToolbarSearch
            value={qInput}
            onChange={setQInput}
            placeholder="Search company or email"
            className="min-w-[200px] flex-[1_1_220px] sm:max-w-[300px]"
          />
          <ToolbarSelect
            label="Approval status"
            value={verificationFilter}
            onChange={applyFilter(setVerificationFilter)}
            allLabel="All approval states"
            options={APPROVAL_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Account status"
            value={status}
            onChange={changeStatus}
            allLabel="All accounts"
            options={STATUS_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Wallet"
            value={walletFilter}
            onChange={applyFilter(setWalletFilter)}
            allLabel="Any wallet"
            options={WALLET_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Industry"
            value={industryFilter}
            onChange={applyFilter(setIndustryFilter)}
            allLabel="All industries"
            options={(industries.data ?? []).map((name) => ({
              value: name,
              label: name,
            }))}
            /* Industries are free text, so the longest one decides how wide a
               native select draws itself. */
            className="max-w-[170px]"
          />
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          )}
          <div className="ml-auto">
            <ColumnsToggle
              columns={cols.columns}
              isVisible={cols.isVisible}
              onToggle={cols.toggle}
            />
          </div>
        </div>

        {isPending ? (
          <TableSkeleton className="rounded-none shadow-none" columns={5} />
        ) : isError ? (
          <div className="m-5 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
            <div className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px] shrink-0" />
              Could not load companies.
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : data.data.length === 0 ? (
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
        ) : (
          <>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={cn(TABLE_TH, "w-[26%]")}>
                      Company
                    </th>
                    {cols.isVisible("approval") && (
                      <th scope="col" className={TABLE_TH}>
                        Approval
                      </th>
                    )}
                    {cols.isVisible("status") && (
                      <th scope="col" className={TABLE_TH}>
                        Account
                      </th>
                    )}
                    {cols.isVisible("jobs") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Jobs
                      </th>
                    )}
                    {cols.isVisible("avgFee") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Avg. Fee
                      </th>
                    )}
                    {cols.isVisible("joined") && (
                      <th scope="col" className={TABLE_TH}>
                        Joined
                      </th>
                    )}
                    {cols.isVisible("wallet") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Wallet
                      </th>
                    )}
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
                                "max-w-[280px] truncate",
                              )}
                              title={[c.email, c.industry]
                                .filter(Boolean)
                                .join(" · ")}
                            >
                              {c.email}
                              {c.industry && ` · ${c.industry}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      {cols.isVisible("approval") && (
                        <td className={TABLE_TD}>
                          <CompanyApproval company={c} />
                        </td>
                      )}
                      {cols.isVisible("status") && (
                        <td className={TABLE_TD}>
                          <CompanyStatus company={c} />
                        </td>
                      )}
                      {cols.isVisible("jobs") && (
                        <td className={cn(TABLE_TD, "text-right")}>
                          <CompanyJobCount company={c} />
                        </td>
                      )}
                      {cols.isVisible("avgFee") && (
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
                      )}
                      {cols.isVisible("joined") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap tabular-nums text-ink-muted",
                          )}
                        >
                          {formatDate(c.joinedAt)}
                        </td>
                      )}
                      {cols.isVisible("wallet") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-right tabular-nums",
                            walletToneClass(c.balanceMinor),
                          )}
                        >
                          {formatMinor(c.balanceMinor)}
                        </td>
                      )}
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
    </div>
  );
}
