"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Banknote } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { QuickViewBand } from "@/shared/ui-components/dashboard/DashboardParts";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ScopeChip } from "@/shared/ui-components/data/ScopeChip";
import {
  ToolbarSearch,
  ToolbarSelect,
} from "@/shared/ui-components/data/ListToolbar";
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
import {
  adminCompanyPath,
  adminJobPath,
  adminPayoutPath,
  adminRecruiterPath,
} from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { DEFAULT_PAGE_SIZE } from "../api/admin";
import { useAdminPayouts, usePayoutsSummary } from "../hooks/useAdmin";
import { ListPager } from "./ListPager";
import { countdown, holdSummary } from "./financeFacts";
import { PAYOUT_VIEW_LABELS, PAYOUT_VIEW_TONES } from "./financeLabels";
import { PAYOUT_VIEWS, type PayoutView, type PayoutsSummary } from "../schemas";

const HOLD_OPTIONS = [
  { value: "dispute", label: "A dispute" },
  { value: "manual", label: "A manual hold" },
  { value: "none", label: "Nothing" },
] as const;

const SORT_OPTIONS = [
  { value: "eligible", label: "Eligibility date" },
  { value: "commission", label: "Commission" },
  { value: "joined", label: "Joining date" },
] as const;

function toPayoutView(value: string): PayoutView {
  return PAYOUT_VIEWS.find((view) => view === value) ?? "all";
}

function shortDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const SUMMARY_KEYS: {
  key: Exclude<PayoutView, "all">;
  summaryKey: keyof Omit<PayoutsSummary, "activeHolds">;
  note: string;
}[] = [
  {
    key: "in_guarantee",
    summaryKey: "inGuarantee",
    note: "Clock still running",
  },
  { key: "ready", summaryKey: "ready", note: "Due in the next release run" },
  { key: "on_hold", summaryKey: "onHold", note: "A dispute or an admin hold" },
  { key: "processing", summaryKey: "processing", note: "Payout in flight" },
  { key: "paid", summaryKey: "paid", note: "Released to the recruiter" },
  { key: "refunded", summaryKey: "refunded", note: "Returned to the company" },
];

/**
 * Commissions owed to recruiters, from the 30-day guarantee to the bank.
 *
 * Every stage it shows is derived from the placement — its status, its clock,
 * and whatever is holding it — so the band, the tabs and the rows cannot
 * disagree about where a commission has got to.
 */
export function RecruiterPayoutsBoard({
  recruiterProfileId,
  recruiterName,
}: {
  /** Restricts the board to one recruiter — a deep-link from their page. */
  recruiterProfileId?: string;
  recruiterName?: string;
} = {}) {
  const [view, setView] = useState<PayoutView>("all");
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [holdKind, setHoldKind] = useState("");
  const [sort, setSort] = useState("eligible");
  const q = useDebouncedValue(qInput, 300);

  const { data, isPending, isError, refetch } = useAdminPayouts({
    page,
    limit: DEFAULT_PAGE_SIZE,
    view,
    q: q || undefined,
    holdKind: holdKind || undefined,
    sort,
    sortOrder: "ASC",
    recruiterProfileId,
  });
  const summary = usePayoutsSummary();

  const rows = data?.data ?? [];
  const hasFilters = qInput !== "" || holdKind !== "" || view !== "all";

  const resetFilters = (): void => {
    setQInput("");
    setHoldKind("");
    setView("all");
    setPage(1);
  };

  const band = summary.data;
  return (
    <div className="flex flex-col gap-4">
      {recruiterProfileId && (
        <ScopeChip
          label={`Recruiter: ${recruiterName || "Selected recruiter"}`}
          clearHref="/admin/payouts"
          clearLabel="Clear recruiter filter"
        />
      )}

      {/* Each tile is the filter it counts: pressing one opens that stage,
          pressing it again goes back to all of them. */}
      <QuickViewBand
        label="Payout pipeline"
        views={SUMMARY_KEYS.map(({ key, summaryKey, note }) => {
          const total = band?.[summaryKey];
          return {
            key,
            label: PAYOUT_VIEW_LABELS[key],
            value: total ? formatMinor(total.amountMinor) : "—",
            note: total
              ? `${total.count} commission${total.count === 1 ? "" : "s"} · ${note}`
              : note,
            tone: PAYOUT_VIEW_TONES[key],
            filter: {
              active: view === key,
              apply: () => {
                setView(view === key ? "all" : key);
                setPage(1);
              },
            },
          };
        })}
      />

      <div className={TABLE_CARD}>
        <div className={TABLE_TOOLBAR}>
          <ToolbarSearch
            value={qInput}
            onChange={(next) => {
              setQInput(next);
              setPage(1);
            }}
            placeholder="Placement, recruiter, company or candidate"
            className="max-w-[340px] flex-1"
          />
          <ToolbarSelect
            label="Stage"
            value={view === "all" ? "" : view}
            onChange={(next) => {
              setView(next === "" ? "all" : toPayoutView(next));
              setPage(1);
            }}
            allLabel="Any stage"
            options={PAYOUT_VIEWS.filter(
              (option): option is Exclude<PayoutView, "all"> =>
                option !== "all",
            ).map((option) => ({
              value: option,
              label: PAYOUT_VIEW_LABELS[option],
            }))}
          />
          <ToolbarSelect
            label="Held by"
            value={holdKind}
            onChange={(next) => {
              setHoldKind(next);
              setPage(1);
            }}
            allLabel="Any hold reason"
            options={HOLD_OPTIONS}
          />
          <ToolbarSelect
            label="Sort by"
            value={sort === "eligible" ? "" : sort}
            onChange={(next) => {
              setSort(next === "" ? "eligible" : next);
              setPage(1);
            }}
            allLabel="Eligibility date"
            options={SORT_OPTIONS.filter(
              (option) => option.value !== "eligible",
            )}
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
        </div>

        {isPending ? (
          <div className="flex flex-col">
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="flex h-15 items-center gap-4 border-t border-line px-5"
              >
                <div className="h-3.5 w-20 animate-pulse rounded-xs bg-surface-sunken" />
                <div className="h-3.5 w-1/4 animate-pulse rounded-xs bg-surface-sunken" />
                <div className="ml-auto h-3.5 w-16 animate-pulse rounded-xs bg-surface-sunken" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="m-5 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
            <div className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px] shrink-0" />
              Could not load recruiter payouts.
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
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No commissions here"
            description="Nothing sits in this stage right now."
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
            <div className={TABLE_SCROLL}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className={TABLE_TH}>Placement</th>
                    <th className={TABLE_TH}>Recruiter</th>
                    <th className={TABLE_TH}>Company</th>
                    <th className={TABLE_TH}>Candidate / Job</th>
                    <th className={cn(TABLE_TH, "text-right")}>Commission</th>
                    <th className={TABLE_TH}>Joined</th>
                    <th className={TABLE_TH}>Eligible</th>
                    <th className={TABLE_TH}>Status</th>
                    <th className={TABLE_TH}>Hold Reason</th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {rows.map((payout) => {
                    const due = countdown(payout.eligibleAt);
                    const hold = holdSummary(payout);
                    return (
                      <tr key={payout.placementId} className={TABLE_ROW}>
                        <td className={TABLE_TD}>
                          <Link
                            href={adminPayoutPath({
                              id: payout.placementId,
                              serialNumber: payout.placementSerialNumber,
                            })}
                            className="font-medium tabular-nums text-blue-ink hover:underline"
                          >
                            PLC-{payout.placementSerialNumber}
                          </Link>
                        </td>
                        <td className={TABLE_TD}>
                          <Link
                            href={adminRecruiterPath({
                              id: payout.recruiterUserId,
                              serialNumber: payout.recruiterSerialNumber,
                            })}
                            className={cn(
                              TABLE_CELL_MAIN,
                              "hover:text-blue-ink hover:underline",
                            )}
                          >
                            {payout.recruiterName}
                          </Link>
                        </td>
                        <td className={TABLE_TD}>
                          <Link
                            href={adminCompanyPath({
                              id: payout.companyUserId,
                              serialNumber: payout.companySerialNumber,
                            })}
                            className="text-ink-body hover:text-blue-ink hover:underline"
                          >
                            {payout.companyName}
                          </Link>
                        </td>
                        <td className={TABLE_TD_STACKED}>
                          <span className={TABLE_CELL_MAIN}>
                            {payout.candidateName}
                          </span>
                          <Link
                            href={adminJobPath({
                              id: payout.jobId,
                              serialNumber: payout.jobSerialNumber,
                            })}
                            className={cn(
                              "block truncate",
                              TABLE_CELL_SUB,
                              "hover:text-blue-ink hover:underline",
                            )}
                          >
                            {payout.jobTitle}
                          </Link>
                        </td>
                        <td
                          className={cn(
                            TABLE_TD,
                            "text-right font-[650] tabular-nums text-ink",
                          )}
                        >
                          {formatMinor(payout.commissionMinor)}
                        </td>
                        <td className={cn(TABLE_TD, "tabular-nums")}>
                          {shortDay(payout.joiningDate)}
                        </td>
                        <td className={TABLE_TD_STACKED}>
                          <span className={cn(TABLE_CELL_MAIN, "tabular-nums")}>
                            {shortDay(payout.eligibleAt)}
                          </span>
                          <span
                            className={cn(
                              "block",
                              due.overdue && payout.view === "on_hold"
                                ? "text-meta font-medium text-warn"
                                : TABLE_CELL_SUB,
                            )}
                          >
                            {due.label}
                          </span>
                        </td>
                        <td className={TABLE_TD}>
                          <StatusBadge
                            label={PAYOUT_VIEW_LABELS[payout.view]}
                            tone={PAYOUT_VIEW_TONES[payout.view]}
                          />
                        </td>
                        <td className={TABLE_TD_STACKED}>
                          {hold ? (
                            <Link
                              href={hold.href}
                              className="block font-medium text-warn hover:underline"
                            >
                              {hold.label}
                              <span className={cn("block", TABLE_CELL_SUB)}>
                                {hold.detail}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data && (
              <ListPager
                page={page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>

      {band && band.activeHolds > 0 && (
        <p className="m-0 flex flex-wrap items-center gap-1.5 text-sub text-ink-muted">
          <span className="font-medium text-ink">
            {band.activeHolds} manual hold{band.activeHolds === 1 ? "" : "s"}
          </span>
          active across the marketplace. A commission releases on day 30 only
          when nothing is holding it — a dispute pauses the payment, not the
          clock, and every hold must clear before the release runs.
        </p>
      )}
    </div>
  );
}
