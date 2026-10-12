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
import {
  QuickViewBand,
  StatValueSkeleton,
  type QuickView,
} from "@/shared/ui-components/dashboard/DashboardParts";
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
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import { US_STATES } from "@/shared/data/usStatesGeo";
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

/**
 * "Since Oct 1" — the point the month's sign-up count is measured from. The
 * stats endpoint keys its buckets `YYYY-MM`, which is a month rather than a
 * day, so the label names the first of it rather than implying a rolling
 * 30-day window.
 */
function monthStartLabel(month: string | undefined): string {
  const [year, monthIndex] = (month ?? "").split("-").map(Number);
  if (!year || !monthIndex) return "This calendar month";
  const start = new Date(year, monthIndex - 1, 1);
  return `Since ${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const;

const VERIFICATION_FILTER_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
] as const;

/** The bands `AdminRecruitersQueryDto.rating` accepts, in the design's order. */
const RATING_FILTER_OPTIONS = [
  { value: "high", label: "4.5 and up" },
  { value: "low", label: "Below 3.0" },
  { value: "unrated", label: "Unrated" },
] as const;

/**
 * Every US state, since the directory is national and a recruiter can sit in
 * any of them. Built once from the same canonical list every state picker in
 * the app uses, so the codes sent here are the codes the profiles store.
 */
const STATE_FILTER_OPTIONS = [...US_STATES]
  .map((state) => ({ value: state.code, label: state.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

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
  const [ratingFilter, setRatingFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const hasFilters =
    qInput !== "" ||
    status !== "" ||
    verificationFilter !== "" ||
    ratingFilter !== "" ||
    stateFilter !== "";
  const resetFilters = () => {
    setQInput("");
    changeStatus("");
    setVerificationFilter("");
    setRatingFilter("");
    setStateFilter("");
    setPage(1);
  };
  // Every filter change returns to page 1: the narrowed list is almost never
  // as long as the page the reader was on, and landing past its end shows an
  // empty table that looks like "no matches".
  const applyFilter = (set: (next: string) => void) => (next: string) => {
    set(next);
    setPage(1);
  };
  const cols = useVisibleColumns("admin.recruiters.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminRecruiters({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    verificationStatus: verificationFilter || undefined,
    rating: ratingFilter || undefined,
    state: stateFilter || undefined,
  });

  const stats = useAdminStats();

  // Each tile stands for the exact pair of filter values it counts, and
  // pressing the tile that is already applied clears it — so the band is both
  // the summary and the way into and back out of each slice.
  const quickFilter = (verification: string, account: string) => {
    const active = verificationFilter === verification && status === account;
    return {
      active,
      apply: () => {
        setVerificationFilter(active ? "" : verification);
        changeStatus(active ? "" : account);
      },
    };
  };

  const counts = stats.data?.recruiters;
  const figure = (value: number | undefined) =>
    value === undefined ? <StatValueSkeleton /> : value.toLocaleString();
  const latestSignups = stats.data?.signups.at(-1);

  const quickViews: readonly QuickView[] = [
    {
      key: "pending",
      label: "Pending Verification",
      value: figure(counts?.pending),
      note: "Awaiting review",
      tone: "warn",
      filter: quickFilter("pending", ""),
    },
    {
      key: "verified",
      label: "Verified & Active",
      value: figure(counts?.verified),
      note: "Can browse and submit",
      tone: "ok",
      filter: quickFilter("verified", "active"),
    },
    {
      key: "suspended",
      label: "Suspended",
      value: figure(counts?.held),
      note: "Marketplace access blocked",
      tone: "bad",
      filter: quickFilter("", "suspended"),
    },
    {
      // Read-only: the list endpoint has no joined-after param, so there is no
      // filter for this figure to apply.
      key: "joined",
      label: "Joined This Month",
      value: figure(latestSignups?.recruiters),
      note: monthStartLabel(latestSignups?.month),
      tone: "info",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Recruiters"
        subtitle="Every recruiter on the platform. Open a profile or suspend an account."
      />

      <QuickViewBand label="Recruiter quick views" views={quickViews} />

      <div className={TABLE_CARD}>
        <div className={TABLE_TOOLBAR}>
          <ToolbarSearch
            value={qInput}
            onChange={setQInput}
            placeholder="Search name, email, location"
            className="min-w-[200px] flex-[1_1_220px] sm:max-w-[300px]"
          />
          <ToolbarSelect
            label="Verification"
            value={verificationFilter}
            onChange={applyFilter(setVerificationFilter)}
            allLabel="All verification"
            options={VERIFICATION_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Account status"
            value={status}
            onChange={changeStatus}
            allLabel="All accounts"
            options={STATUS_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Rating"
            value={ratingFilter}
            onChange={applyFilter(setRatingFilter)}
            allLabel="Any rating"
            options={RATING_FILTER_OPTIONS}
          />
          <ToolbarSelect
            label="Location"
            value={stateFilter}
            onChange={applyFilter(setStateFilter)}
            allLabel="All locations"
            options={STATE_FILTER_OPTIONS}
            /* A native select sizes to its widest option, and the state list
               holds "District of Columbia" — uncapped it would take a third
               of the toolbar to show a value that is usually two words. */
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
              Could not load recruiters.
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
        ) : (
          <>
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
                        Account
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
                            variant="text"
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
