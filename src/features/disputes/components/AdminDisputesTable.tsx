"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { adminDisputePath } from "@/shared/utils/entityPaths";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  TABLE_BODY,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_ROW_UNREAD,
  TABLE_TD_RAIL,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";

import { ScopeChip } from "@/shared/ui-components/data/ScopeChip";
import {
  TABLE_CARD,
  TABLE_TD_STACKED,
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import type { PillTone } from "@/shared/ui-components/badges/Pill";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import {
  QuickViewBand,
  StatValueSkeleton,
  type QuickView,
} from "@/shared/ui-components/dashboard/DashboardParts";
import {
  ToolbarSearch,
  ToolbarSelect,
} from "@/shared/ui-components/data/ListToolbar";
import { useAdminDisputeSummary, useAdminDisputes } from "../hooks/useDisputes";
import {
  type AdminDisputeListItem,
  DISPUTE_SUBJECT_LABELS,
  type DisputeChannel,
  type DisputeStatus,
} from "../schemas";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/**
 * Each view names the statuses the server should keep; no view selected is the
 * unfiltered list, so the filter's own Clear row is what used to be "All".
 */
/**
 * The board's tabs. "Needs my attention" is not a status — it is the unread
 * flag — so it carries the open statuses and sets `unread` as well.
 */
const STATUS_VIEWS: {
  label: string;
  value: string;
  statuses: readonly DisputeStatus[];
  unread?: boolean;
}[] = [
  {
    label: "All open",
    value: "open_active",
    statuses: ["open", "under_review"],
  },
  {
    label: "Needs my attention",
    value: "needs_attention",
    statuses: ["open", "under_review"],
    unread: true,
  },
  {
    label: "Resolved",
    value: "resolved",
    statuses: [
      "resolved_release",
      "resolved_refund",
      "resolved_split",
      "resolved_resumed",
    ],
  },
  { label: "Closed", value: "closed", statuses: ["closed"] },
];

/** A dispute pauses the payment, so an open case is always on hold. */
function paymentLabel(d: AdminDisputeListItem): string {
  if (d.status === "resolved_release") return "Released";
  if (d.status === "resolved_refund") return "Refunded";
  if (d.status === "closed" || d.status.startsWith("resolved"))
    return "Settled";
  return "On hold";
}

function paymentTone(d: AdminDisputeListItem): PillTone {
  if (d.status === "resolved_release") return "ok";
  if (d.status === "resolved_refund") return "neutral";
  if (d.status === "closed" || d.status.startsWith("resolved"))
    return "neutral";
  return "warn";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days until the commission was originally due; negative once it has passed. */
function daysUntilPayout(d: AdminDisputeListItem): number | null {
  if (!d.holdExpiresAt) return null;
  return Math.round(
    (new Date(d.holdExpiresAt).getTime() - Date.now()) / DAY_MS,
  );
}

function dueSoon(d: AdminDisputeListItem): boolean {
  const days = daysUntilPayout(d);
  return days !== null && days <= 3;
}

/** The original date never moves — a dispute pauses the payment, not the
 *  clock — so this counts toward it rather than describing a new one. */
function dueLabel(d: AdminDisputeListItem): string {
  const days = daysUntilPayout(d);
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

const SORT_OPTIONS = [
  { value: "needs_action", label: "Needs action first" },
  { value: "payout_soonest", label: "Payout soonest" },
  { value: "newest", label: "Newest" },
] as const;

const COLUMNS: ColumnDef[] = [
  // Case carries the unread rail, so the row loses its "new activity" cue
  // without it; Actions holds the only way into the dispute.
  { key: "case", label: "Case", required: true },
  { key: "parties", label: "Company · Recruiter" },
  { key: "status", label: "Case Status" },
  { key: "payment", label: "Payment" },
  { key: "payout", label: "Original Payout" },
  { key: "activity", label: "Last Activity" },
  { key: "fee", label: "Held" },
  { key: "actions", label: "Actions", required: true },
];

const RAISED_BY_LABELS: Record<DisputeChannel, string> = {
  company: "Company",
  recruiter: "Recruiter",
};

const RAISED_BY_OPTIONS: { label: string; value: DisputeChannel }[] = [
  { label: "Raised by Company", value: "company" },
  { label: "Raised by Recruiter", value: "recruiter" },
];

/** Narrows the filter's plain string back to a channel the query accepts;
 * `undefined` is the unfiltered list. */
const toRaisedBy = (value: string | null): DisputeChannel | undefined =>
  RAISED_BY_OPTIONS.find((option) => option.value === value)?.value;

/** `fetchAdminDisputes` asks for 25 a page; the pager's range readout has to
 * agree with it. */
const ADMIN_DISPUTES_PAGE_SIZE = 25;

interface AdminDisputesTableProps {
  /** When set, the inbox is restricted to one company (a deep-link). */
  companyProfileId?: string;
  companyName?: string;
}

/** The admin dispute inbox. */
export function AdminDisputesTable({
  companyProfileId,
  companyName,
}: AdminDisputesTableProps = {}) {
  const [page, setPage] = useState(1);
  const [statusView, setStatusView] = useState<string | null>("open_active");
  const [raisedBy, setRaisedBy] = useState<DisputeChannel | undefined>(
    undefined,
  );
  const [qInput, setQInput] = useState("");
  const [sort, setSort] = useState<string>("needs_action");
  const q = useDebouncedValue(qInput, 300);
  const cols = useVisibleColumns("admin.disputes.columns", COLUMNS);
  const view = STATUS_VIEWS.find((v) => v.value === statusView);
  const summary = useAdminDisputeSummary();

  const { data, isPending, isError, refetch } = useAdminDisputes({
    page,
    statuses: view?.statuses,
    raisedBy,
    companyProfileId,
    q: q || undefined,
    unread: view?.unread,
    sort,
  });

  const rows = data?.data ?? [];

  // The board opens on "All open", and the tabs sit above a table the empty
  // state replaces — so an admin with nothing open needs a way back.
  const hasFilters =
    statusView !== "open_active" || raisedBy !== undefined || qInput !== "";
  const resetFilters = () => {
    setStatusView("open_active");
    setRaisedBy(undefined);
    setQInput("");
    setPage(1);
  };

  const figure = (value: number | undefined) =>
    value === undefined ? <StatValueSkeleton /> : value.toLocaleString();

  const quickViews: readonly QuickView[] = [
    {
      key: "open",
      label: "Open Cases",
      value: figure(summary.data?.openCases),
      note: `Across ${summary.data?.companies ?? 0} compan${
        summary.data?.companies === 1 ? "y" : "ies"
      }`,
      tone: "info",
      filter: {
        active: statusView === "open_active",
        apply: () => {
          setStatusView("open_active");
          setPage(1);
        },
      },
    },
    {
      key: "attention",
      label: "Needs My Attention",
      value: figure(summary.data?.needsAttention),
      note: "Unread since the last message",
      tone: "warn",
      filter: {
        active: statusView === "needs_attention",
        apply: () => {
          setStatusView("needs_attention");
          setPage(1);
        },
      },
    },
    {
      key: "due",
      label: "Payout Due Within 3 Days",
      value: figure(summary.data?.payoutDueSoon),
      note: "Original dates, unchanged by the dispute",
      tone: "bad",
      // No server filter for a date window, so this reports rather than
      // pretending to narrow the list.
    },
    {
      key: "held",
      label: "Held In Open Disputes",
      value:
        summary.data === undefined ? (
          <StatValueSkeleton />
        ) : (
          formatMinor(summary.data.heldMinor)
        ),
      note: "Released only by a decision",
      tone: "neutral",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {companyProfileId && (
        <ScopeChip
          label={`Company: ${companyName || "Selected company"}`}
          clearHref="/admin/disputes"
          clearLabel="Clear company filter"
        />
      )}
      <QuickViewBand label="Dispute quick views" views={quickViews} />

      <div className={TABLE_CARD}>
        {/* Tabs above the toolbar: the slice first, then how it is narrowed
            and ordered — the same reading order the design gives. */}
        <div className={TABLE_TOOLBAR}>
          <ToolbarSearch
            value={qInput}
            onChange={setQInput}
            placeholder="Case, company, recruiter, candidate"
            className="min-w-[200px] flex-[1_1_240px] sm:max-w-[320px]"
          />
          <ToolbarSelect
            label="Case status"
            value={statusView ?? ""}
            onChange={(next) => {
              setStatusView(next === "" ? "open_active" : next);
              setPage(1);
            }}
            allLabel="All open"
            options={STATUS_VIEWS.filter(
              (option) => option.value !== "open_active",
            ).map(({ label, value }) => ({ label, value }))}
          />
          <ToolbarSelect
            label="Raised by"
            value={raisedBy ?? ""}
            onChange={(next) => {
              setRaisedBy(toRaisedBy(next === "" ? null : next));
              setPage(1);
            }}
            allLabel="Raised by anyone"
            options={RAISED_BY_OPTIONS}
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
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sub text-ink-muted">Sort</span>
            <ToolbarSelect
              label="Sort order"
              value={sort}
              onChange={(next) => {
                setSort(next === "" ? "needs_action" : next);
                setPage(1);
              }}
              allLabel="Needs action first"
              options={SORT_OPTIONS.filter(
                (option) => option.value !== "needs_action",
              )}
            />
            <ColumnsToggle
              columns={cols.columns}
              isVisible={cols.isVisible}
              onToggle={cols.toggle}
            />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
            <AlertCircle className="size-[22px]" />
            Could not load disputes.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : isPending ? (
          <div className="p-4">
            <TableSkeleton
              columns={cols.allKeys.filter(cols.isVisible).length}
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sub text-ink-muted">No disputes here.</p>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={cn(TABLE_TH, "w-[26%]")}>
                      Case
                    </th>
                    {cols.isVisible("parties") && (
                      <th scope="col" className={TABLE_TH}>
                        Company · Recruiter
                      </th>
                    )}
                    {cols.isVisible("status") && (
                      <th scope="col" className={TABLE_TH}>
                        Case Status
                      </th>
                    )}
                    {cols.isVisible("payment") && (
                      <th scope="col" className={TABLE_TH}>
                        Payment
                      </th>
                    )}
                    {cols.isVisible("payout") && (
                      <th scope="col" className={TABLE_TH}>
                        Original Payout
                      </th>
                    )}
                    {cols.isVisible("activity") && (
                      <th scope="col" className={TABLE_TH}>
                        Last Activity
                      </th>
                    )}
                    {cols.isVisible("fee") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Held
                      </th>
                    )}
                    <th scope="col" className={TABLE_TH} />
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {rows.map((d) => (
                    <tr
                      key={d.id}
                      className={d.unread ? TABLE_ROW_UNREAD : TABLE_ROW}
                    >
                      <td
                        className={cn(
                          TABLE_TD_STACKED,
                          d.unread && TABLE_TD_RAIL,
                        )}
                      >
                        <span className="flex items-start gap-2">
                          <span className="flex w-2.5 shrink-0 justify-center pt-1.5">
                            {d.unread && (
                              <span
                                className="block size-2.5 shrink-0 rounded-full bg-blue"
                                aria-label="New activity"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={adminDisputePath({
                                id: d.id,
                                serialNumber: d.serialNumber,
                              })}
                              className={cn(
                                "block transition-colors hover:text-blue focus-visible:underline focus-visible:outline-none",
                                d.unread
                                  ? "font-[650] text-ink"
                                  : "font-medium text-ink",
                              )}
                            >
                              {DISPUTE_SUBJECT_LABELS[d.subject]}
                            </Link>
                            <span className="block truncate text-meta text-ink-muted">
                              {d.serialNumber ? `DSP-${d.serialNumber} · ` : ""}
                              {d.candidateName}
                            </span>
                          </span>
                        </span>
                      </td>
                      {cols.isVisible("parties") && (
                        <td className={TABLE_TD_STACKED}>
                          <span className="block text-ink">
                            {d.companyName}
                          </span>
                          <span className="block text-meta text-ink-muted">
                            {d.recruiterName}
                          </span>
                        </td>
                      )}
                      {cols.isVisible("status") && (
                        <td className={TABLE_TD}>
                          <DisputeStatusBadge status={d.status} />
                        </td>
                      )}
                      {cols.isVisible("payment") && (
                        <td className={TABLE_TD}>
                          <StatusBadge
                            label={paymentLabel(d)}
                            tone={paymentTone(d)}
                          />
                        </td>
                      )}
                      {cols.isVisible("payout") && (
                        <td className={TABLE_TD_STACKED}>
                          <span className="block whitespace-nowrap tabular-nums text-ink">
                            {d.holdExpiresAt
                              ? formatDate(d.holdExpiresAt)
                              : "—"}
                          </span>
                          <span
                            className={cn(
                              "block whitespace-nowrap text-meta",
                              dueSoon(d) ? "text-warn" : "text-ink-muted",
                            )}
                          >
                            {dueLabel(d)}
                          </span>
                        </td>
                      )}
                      {cols.isVisible("activity") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap tabular-nums text-ink-muted",
                          )}
                        >
                          {d.lastActivityAt
                            ? formatDate(d.lastActivityAt)
                            : formatDate(d.createdAt)}
                        </td>
                      )}
                      {cols.isVisible("fee") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                          )}
                        >
                          {formatMinor(d.amountMinor)}
                        </td>
                      )}
                      <td className={cn(TABLE_TD, "text-right")}>
                        <Button asChild variant="outline" size="xs">
                          <Link
                            href={adminDisputePath({
                              id: d.id,
                              serialNumber: d.serialNumber,
                            })}
                          >
                            Open
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <MobileRecordList className="sm:hidden">
              {rows.map((d) => (
                <MobileRecordCard
                  key={d.id}
                  title={`${d.candidateName} · ${d.jobTitle}`}
                  subtitle={`${d.companyName} ↔ ${d.recruiterName}`}
                  trailing={<DisputeStatusBadge status={d.status} />}
                  href={adminDisputePath(d)}
                  className={cn(d.unread && "bg-unread shadow-rail")}
                  fields={[
                    { label: "Raised By", value: RAISED_BY_LABELS[d.raisedBy] },
                    {
                      label: "Subject",
                      value: DISPUTE_SUBJECT_LABELS[d.subject],
                    },
                    { label: "Fee", value: formatMinor(d.amountMinor) },
                    { label: "Opened", value: formatDate(d.createdAt) },
                  ]}
                />
              ))}
            </MobileRecordList>

            <TablePager
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPage={setPage}
              pageSize={ADMIN_DISPUTES_PAGE_SIZE}
            />
          </>
        )}
      </div>
    </div>
  );
}
