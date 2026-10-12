"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { AlertCircle, Banknote, ChevronRight, Clock } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { PageHeader } from "@/shared/ui-components/brand";
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
  adminConversationPath,
  adminJobPath,
  adminPayoutPath,
  adminRecruiterPath,
  urlRef,
} from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { DEFAULT_PAGE_SIZE, fetchPayoutsCsv } from "../api/admin";
import {
  useAdminPayout,
  useAdminPayouts,
  usePayoutsSummary,
} from "../hooks/useAdmin";
import { useCsvExport } from "../hooks/useCsvExport";
import { FinanceHeaderActions } from "./FinanceHeaderActions";
import { ListPager } from "./ListPager";
import { countdown, holdSummary } from "./financeFacts";
import {
  DESTINATION_STATUS_LABELS,
  HOLD_REASON_LABELS,
  PAYOUT_VIEW_LABELS,
  PAYOUT_VIEW_TONES,
  windowLabel,
} from "./financeLabels";
import {
  PAYOUT_VIEWS,
  type AdminPayout,
  type PayoutView,
  type PayoutsSummary,
} from "../schemas";

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

/**
 * The stage tiles. Processing and Refunded are left to the tabs: the band is
 * the money an admin acts on, and those two need nothing from them.
 */
const STAGE_TILES: {
  key: "in_guarantee" | "ready" | "on_hold" | "paid";
  summaryKey: "inGuarantee" | "ready" | "onHold" | "paid";
  label: string;
  note: string;
}[] = [
  {
    key: "in_guarantee",
    summaryKey: "inGuarantee",
    label: "In Guarantee",
    note: "Clock still running",
  },
  {
    key: "ready",
    summaryKey: "ready",
    label: "Ready for Release",
    note: "Due in the next release run",
  },
  {
    key: "on_hold",
    summaryKey: "onHold",
    label: "On Hold",
    note: "A dispute or an admin hold",
  },
  {
    key: "paid",
    summaryKey: "paid",
    label: "Paid",
    note: "Released to the recruiter",
  },
];

const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/** "6:00 PM", or "Tomorrow 12:00 AM" when the run is past midnight. */
function runTime(iso: string): string {
  const at = new Date(iso);
  const time = at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return at.toDateString() === new Date().toDateString()
    ? time
    : `Tomorrow ${time}`;
}

const DETAIL_HEADING =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted";
const DETAIL_LINK = "truncate font-medium text-blue-ink hover:underline";

function longDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FactList({ facts }: { facts: readonly [string, string][] }) {
  return (
    <dl className="m-0 mt-2.5 flex flex-col gap-2 text-sub">
      {facts.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-3">
          <dt className="w-28 shrink-0 text-ink-muted">{label}</dt>
          <dd className="m-0 min-w-0 break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A row opened in place — Company Payments' transaction drawer, read for a
 * commission. What the list row cannot carry (holds, the payout account, the
 * funding entry) comes from the placement's own detail, fetched only once the
 * row is opened and cached under the same key the full detail page uses.
 */
function PayoutDetail({ payout }: { payout: AdminPayout }) {
  const ref = urlRef({
    id: payout.placementId,
    serialNumber: payout.placementSerialNumber,
  });
  const detail = useAdminPayout(ref);
  const activeHolds = detail.data?.holds.filter((h) => !h.releasedAt) ?? [];
  const destination = detail.data?.destination;
  const funding = detail.data?.funding;

  return (
    <div className="grid gap-x-8 gap-y-5 bg-surface-sub px-5 py-4 md:grid-cols-3">
      <div>
        <h3 className={DETAIL_HEADING}>Commission</h3>
        <FactList
          facts={[
            ["Stage", PAYOUT_VIEW_LABELS[payout.view]],
            ["Commission", formatMinor(payout.commissionMinor)],
            ["Joined", longDate(payout.joiningDate)],
            ["Eligible", longDate(payout.eligibleAt)],
            ["Released", longDate(payout.releasedAt)],
          ]}
        />
      </div>

      <div>
        <h3 className={DETAIL_HEADING}>Holds & Destination</h3>
        {detail.isPending ? (
          <p className="m-0 mt-2.5 text-sub text-ink-muted">Loading…</p>
        ) : detail.isError ? (
          <p className="m-0 mt-2.5 text-sub text-bad">
            Could not load the holds and payout account.
          </p>
        ) : (
          <>
            <FactList
              facts={[
                [
                  "Holding it",
                  activeHolds.length === 0
                    ? "Nothing"
                    : activeHolds
                        .map((hold) =>
                          hold.kind === "dispute"
                            ? `Dispute DSP-${hold.disputeSerialNumber ?? "—"}`
                            : hold.reason
                              ? HOLD_REASON_LABELS[hold.reason]
                              : "Manual hold",
                        )
                        .join(", "),
                ],
                [
                  "Payout account",
                  destination?.status
                    ? [
                        DESTINATION_STATUS_LABELS[destination.status] ??
                          destination.status,
                        destination.bankLast4 &&
                          `•••• ${destination.bankLast4}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : DESTINATION_STATUS_LABELS.none,
                ],
                [
                  "Funded by",
                  funding?.serialNumber
                    ? `TXN-${funding.serialNumber} · ${longDate(funding.reservedAt)}`
                    : "—",
                ],
              ]}
            />
            {destination?.disabledReason && (
              <p className="m-0 mt-2.5 text-meta text-warn">
                {destination.disabledReason}
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <h3 className={DETAIL_HEADING}>Related Records</h3>
        <ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0 text-sub">
          {(
            [
              [
                "Recruiter",
                payout.recruiterName,
                adminRecruiterPath({
                  id: payout.recruiterUserId,
                  serialNumber: payout.recruiterSerialNumber,
                }),
              ],
              [
                "Company",
                payout.companyName,
                adminCompanyPath({
                  id: payout.companyUserId,
                  serialNumber: payout.companySerialNumber,
                }),
              ],
              [
                "Job",
                payout.jobTitle,
                adminJobPath({
                  id: payout.jobId,
                  serialNumber: payout.jobSerialNumber,
                }),
              ],
              [
                "Candidate",
                payout.candidateName,
                adminConversationPath({
                  id: payout.candidateId,
                  serialNumber: payout.candidateSerialNumber,
                }),
              ],
            ] satisfies [string, string, string][]
          ).map(([label, name, href]) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="shrink-0 text-ink-muted">{label}</span>
              <Link href={href} className={DETAIL_LINK}>
                {name}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={adminPayoutPath({
            id: payout.placementId,
            serialNumber: payout.placementSerialNumber,
          })}
          className="mt-3 inline-block text-sub font-medium text-blue-ink hover:underline"
        >
          Open full detail →
        </Link>
      </div>
    </div>
  );
}

/** The hourly release sweep's next run, and what it is due to release. */
function NextRunChip({ run }: { run: PayoutsSummary["nextRun"] }) {
  return (
    <span className="inline-flex h-9.5 items-center gap-2 rounded-sm bg-tint px-3 text-sub text-blue-ink">
      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Next payout run <span className="font-medium">{runTime(run.at)}</span>
        {" · "}
        {run.count > 0 ? `${formatMinor(run.amountMinor)} due` : "nothing due"}
      </span>
    </span>
  );
}

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
  const [withinDays, setWithinDays] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const q = useDebouncedValue(qInput, 300);

  const days = withinDays ? Number(withinDays) : undefined;
  const filters = {
    view,
    q: q || undefined,
    holdKind: holdKind || undefined,
    sort,
    sortOrder: "ASC",
    recruiterProfileId,
    withinDays: days,
  };
  const { data, isPending, isError, refetch } = useAdminPayouts({
    ...filters,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });
  const summary = usePayoutsSummary(days);
  const exportCsv = useCsvExport("payouts", fetchPayoutsCsv);

  const rows = data?.data ?? [];
  const hasFilters =
    qInput !== "" || holdKind !== "" || withinDays !== "" || view !== "all";

  const resetFilters = (): void => {
    setQInput("");
    setHoldKind("");
    setWithinDays("");
    setView("all");
    setPage(1);
  };

  const band = summary.data;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Recruiter Payouts"
        subtitle={
          <>
            Commissions owed to recruiters, from the 30-day guarantee to the
            bank. Company deposits and wallets are in{" "}
            <Link
              href="/admin/payments"
              className="font-medium text-blue-ink hover:underline"
            >
              Company Payments
            </Link>
            .
          </>
        }
        actions={
          <FinanceHeaderActions
            leading={band && <NextRunChip run={band.nextRun} />}
            withinDays={withinDays}
            onWithinDays={(next) => {
              setWithinDays(next);
              setPage(1);
            }}
            onExport={() => exportCsv.mutate(filters)}
            exporting={exportCsv.isPending}
          />
        }
      />

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
        views={[
          ...STAGE_TILES.map(({ key, summaryKey, label, note }) => {
            const total = band?.[summaryKey];
            return {
              key,
              // Paid is a flow, so it carries the window it was counted over.
              label: key === "paid" ? `${label} · ${windowLabel(days)}` : label,
              value: total ? formatMinor(total.amountMinor) : "—",
              note: total
                ? `${plural(total.count, "commission")} · ${note}`
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
          }),
          // A failed withdrawal is the recruiter's bank transfer, not a
          // placement, so there is no tab of rows behind this tile to open.
          {
            key: "failed",
            label: `Failed · ${windowLabel(days)}`,
            value: band ? formatMinor(band.failed.amountMinor) : "—",
            note: band
              ? `${plural(band.failed.count, "bank withdrawal")} · Needs follow-up`
              : "Bank withdrawals Stripe could not pay",
            tone: "bad",
          },
        ]}
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
                    const expanded = expandedId === payout.placementId;
                    return (
                      <Fragment key={payout.placementId}>
                        <tr className={cn(TABLE_ROW, expanded && "bg-tint")}>
                          <td className={TABLE_TD}>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              onClick={() =>
                                setExpandedId(
                                  expanded ? null : payout.placementId,
                                )
                              }
                              className="flex items-center gap-2 text-left font-medium tabular-nums text-ink"
                            >
                              <ChevronRight
                                aria-hidden="true"
                                className={cn(
                                  "size-3.5 shrink-0 text-ink-muted transition-transform",
                                  expanded && "rotate-90",
                                )}
                              />
                              PLC-{payout.placementSerialNumber}
                            </button>
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
                            <span
                              className={cn(TABLE_CELL_MAIN, "tabular-nums")}
                            >
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
                        {expanded && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <PayoutDetail payout={payout} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
