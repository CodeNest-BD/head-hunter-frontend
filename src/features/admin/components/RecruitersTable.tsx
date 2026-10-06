"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";

import { PageHeader } from "@/shared/ui-components/brand";
import {
  MobileRecordCard,
  MobileRecordList,
  type MobileRecordField,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableAvatar } from "@/shared/ui-components/data/TableAvatar";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { TableFilterBar } from "@/shared/ui-components/data/TableFilterBar";
import {
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { useAdminRecruiters, useAdminStats } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { VERIFICATION_LABELS, type RecruiterListItem } from "../schemas";
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
import { adminRecruiterPath } from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";

const recruiterDetailHref = (recruiter: RecruiterListItem): string =>
  adminRecruiterPath({
    id: recruiter.userId,
    serialNumber: recruiter.recruiterSerialNumber,
  });

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

const VERIFICATION_FILTER_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
] as const;

const COLUMNS: ColumnDef[] = [
  { key: "recruiter", label: "Recruiter", required: true },
  { key: "verification", label: "Verification" },
  { key: "rating", label: "Rating" },
  { key: "location", label: "Location" },
  { key: "joined", label: "Joined" },
  { key: "status", label: "Status" },
  { key: "placements", label: "Placements" },
  { key: "commissions", label: "Commissions" },
  { key: "actions", label: "Actions", required: true },
];

function recruiterName(recruiter: RecruiterListItem): string {
  return `${recruiter.firstName} ${recruiter.lastName}`;
}

function recruiterLocation(recruiter: RecruiterListItem): string {
  return [recruiter.city, recruiter.state].filter(Boolean).join(", ") || "—";
}

function RecruiterVerification({
  recruiter,
}: {
  recruiter: RecruiterListItem;
}) {
  return (
    <StatusBadge
      label={VERIFICATION_LABELS[recruiter.verificationStatus]}
      tone={
        VERIFICATION_STATUS_TONES[recruiter.verificationStatus] ?? "neutral"
      }
    />
  );
}

function RecruiterStatus({ recruiter }: { recruiter: RecruiterListItem }) {
  return (
    <StatusBadge
      label={ACCOUNT_STATUS_LABELS[recruiter.status]}
      tone={ACCOUNT_STATUS_TONES[recruiter.status]}
    />
  );
}

function RecruiterCard({ recruiter }: { recruiter: RecruiterListItem }) {
  const fields: MobileRecordField[] = [
    {
      label: "Verification",
      value: <RecruiterVerification recruiter={recruiter} />,
    },
    {
      label: "Rating",
      value: (
        <RatingStars
          value={recruiter.ratingAvg}
          count={recruiter.ratingCount}
        />
      ),
    },
    { label: "Location", value: recruiterLocation(recruiter) },
    { label: "Joined", value: formatDate(recruiter.joinedAt) },
    { label: "Placements", value: recruiter.placementCount },
    { label: "Commissions", value: formatMinor(recruiter.commissionMinor) },
  ];

  return (
    <MobileRecordCard
      title={recruiterName(recruiter)}
      subtitle={recruiter.email}
      href={recruiterDetailHref(recruiter)}
      trailing={<RecruiterStatus recruiter={recruiter} />}
      fields={fields}
      actions={
        <AccountRowActions
          userId={recruiter.userId}
          status={recruiter.status}
          subjectName={recruiterName(recruiter)}
          viewHref={recruiterDetailHref(recruiter)}
          kind="recruiter"
        />
      }
    />
  );
}

export function RecruitersTable() {
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
  const cols = useVisibleColumns("admin.recruiters.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminRecruiters({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    verificationStatus: verificationFilter || undefined,
  });

  const stats = useAdminStats();
  const pendingTotal =
    useAdminRecruiters({ page: 1, verificationStatus: "pending", limit: 1 })
      .data?.meta.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Recruiters"
        subtitle="Every recruiter on the platform. Open a profile or suspend an account."
        metrics={[
          { label: "Pending", value: pendingTotal },
          { label: "Active", value: stats.data?.recruiters.active ?? 0 },
          { label: "Suspended", value: stats.data?.recruiters.held ?? 0 },
        ]}
      />

      <TableFilterBar
        filters={[
          {
            kind: "search",
            key: "q",
            label: "Search recruiters",
            placeholder: "Search recruiters by name or email…",
            value: qInput,
            onChange: setQInput,
          },
          {
            kind: "select",
            key: "status",
            label: "Status",
            placeholder: "All statuses",
            options: STATUS_FILTER_OPTIONS,
            value: status,
            onChange: changeStatus,
          },
          {
            kind: "select",
            key: "verification",
            label: "Verification",
            placeholder: "All verification",
            options: VERIFICATION_FILTER_OPTIONS,
            value: verificationFilter,
            onChange: (next) => {
              setVerificationFilter(next);
              setPage(1);
            },
          },
        ]}
        columns={cols.columns}
        isColumnVisible={cols.isVisible}
        onToggleColumn={cols.toggle}
        onClearFilters={resetFilters}
      />

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load recruiters.
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
            icon={Users}
            title="No recruiters found"
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
                    <th scope="col" className={cn(TABLE_TH, "w-[22%]")}>
                      Recruiter
                    </th>
                    {cols.isVisible("verification") && (
                      <th scope="col" className={TABLE_TH}>
                        Verification
                      </th>
                    )}
                    {cols.isVisible("rating") && (
                      <th scope="col" className={TABLE_TH}>
                        Rating
                      </th>
                    )}
                    {cols.isVisible("location") && (
                      <th scope="col" className={TABLE_TH}>
                        Location
                      </th>
                    )}
                    {cols.isVisible("joined") && (
                      <th scope="col" className={TABLE_TH}>
                        Joined
                      </th>
                    )}
                    {cols.isVisible("status") && (
                      <th scope="col" className={TABLE_TH}>
                        Status
                      </th>
                    )}
                    {cols.isVisible("placements") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Placements
                      </th>
                    )}
                    {cols.isVisible("commissions") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Commissions
                      </th>
                    )}
                    <th scope="col" className={cn(TABLE_TH, "w-11 text-right")}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {data.data.map((r) => (
                    <tr key={r.userId} className={TABLE_ROW}>
                      <td className={TABLE_TD_STACKED}>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={recruiterName(r)} />
                          <div className="min-w-0">
                            <Link
                              href={recruiterDetailHref(r)}
                              className={cn(
                                TABLE_CELL_MAIN,
                                "transition-colors hover:text-blue focus-visible:underline focus-visible:outline-none",
                              )}
                            >
                              {r.firstName} {r.lastName}
                            </Link>
                            <p
                              className={cn(
                                TABLE_CELL_SUB,
                                "max-w-[240px] truncate",
                              )}
                              title={r.email}
                            >
                              {r.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      {cols.isVisible("verification") && (
                        <td className={TABLE_TD}>
                          <RecruiterVerification recruiter={r} />
                        </td>
                      )}
                      {cols.isVisible("rating") && (
                        <td className={cn(TABLE_TD, "whitespace-nowrap")}>
                          <RatingStars
                            value={r.ratingAvg}
                            count={r.ratingCount}
                          />
                        </td>
                      )}
                      {cols.isVisible("location") && (
                        <td className={cn(TABLE_TD, "text-ink-muted")}>
                          {recruiterLocation(r)}
                        </td>
                      )}
                      {cols.isVisible("joined") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap tabular-nums text-ink-muted",
                          )}
                        >
                          {formatDate(r.joinedAt)}
                        </td>
                      )}
                      {cols.isVisible("status") && (
                        <td className={TABLE_TD}>
                          <RecruiterStatus recruiter={r} />
                        </td>
                      )}
                      {cols.isVisible("placements") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-right tabular-nums text-ink",
                          )}
                        >
                          {r.placementCount}
                        </td>
                      )}
                      {cols.isVisible("commissions") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                          )}
                        >
                          {formatMinor(r.commissionMinor)}
                        </td>
                      )}
                      <td className={cn(TABLE_TD, "text-right")}>
                        <AccountRowActions
                          userId={r.userId}
                          status={r.status}
                          subjectName={recruiterName(r)}
                          viewHref={recruiterDetailHref(r)}
                          kind="recruiter"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MobileRecordList className="sm:hidden">
              {data.data.map((r) => (
                <RecruiterCard key={r.userId} recruiter={r} />
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
