"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Wallet2 } from "lucide-react";

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
  adminDisputePath,
  adminJobPath,
  adminPayoutPath,
} from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { DEFAULT_PAGE_SIZE, fetchPaymentsCsv } from "../api/admin";
import {
  useAdminPayments,
  usePaymentCounts,
  usePaymentsSummary,
} from "../hooks/useAdmin";
import { useCsvExport } from "../hooks/useCsvExport";
import { FinanceHeaderActions } from "./FinanceHeaderActions";
import { ListPager } from "./ListPager";
import {
  describeMovement,
  walletBeforeAfter,
  walletEffect,
} from "./financeFacts";
import {
  ENTRY_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  PAYMENT_VIEW_LABELS,
  REFERENCE_LABELS,
  REFERENCE_PREFIXES,
  windowLabel,
} from "./financeLabels";
import {
  PAYMENT_VIEWS,
  type AdminPayment,
  type PaymentCounts,
  type PaymentView,
} from "../schemas";

const STATUS_OPTIONS = [
  { value: "succeeded", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

const LINKED_OPTIONS = [
  { value: "topup", label: "A deposit" },
  { value: "job", label: "A job" },
  { value: "placement", label: "A placement" },
  { value: "dispute", label: "A dispute" },
  { value: "subscription", label: "A subscription" },
] as const;

const VIEW_COUNT: Record<PaymentView, keyof PaymentCounts> = {
  all: "all",
  deposits: "deposits",
  reservations: "reservations",
  settlements: "settlements",
  refunds: "refunds",
  other: "other",
  failed: "failed",
};

/** Narrows a tab's string back to a view without a cast. */
function toPaymentView(value: string): PaymentView {
  return PAYMENT_VIEWS.find((view) => view === value) ?? "all";
}

function formatWhen(iso: string): { day: string; time: string } {
  const at = new Date(iso);
  return {
    day: at.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    time: at.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

/** `TXN-88431`, or the raw id for a row that never reached a wallet. */
function transactionRef(payment: AdminPayment): string {
  return payment.serialNumber === null
    ? "Not posted"
    : `TXN-${payment.serialNumber}`;
}

/** Where the referenced record lives, when an admin can open it. */
function referenceHref(payment: AdminPayment): string | null {
  const { referenceType, referenceId, referenceSerialNumber } = payment;
  if (!referenceType || !referenceId) return null;
  const ref = {
    id: referenceId,
    serialNumber: referenceSerialNumber ?? undefined,
  };
  if (referenceType === "job") return adminJobPath(ref);
  if (referenceType === "dispute") return adminDisputePath(ref);
  // A placement has no page of its own; its payout is the nearest record.
  if (referenceType === "placement") return adminPayoutPath(ref);
  return null;
}

function referenceLabel(payment: AdminPayment): string {
  const { referenceType, referenceSerialNumber, providerRef } = payment;
  if (
    referenceType &&
    referenceSerialNumber &&
    REFERENCE_PREFIXES[referenceType]
  ) {
    return `${REFERENCE_PREFIXES[referenceType]}-${referenceSerialNumber}`;
  }
  if (referenceType === "topup") return providerRef ?? "Company deposit";
  return providerRef ?? "—";
}

/** The design's expanded row: the movement, the wallet, and what it points at. */
function PaymentDetail({ payment }: { payment: AdminPayment }) {
  const href = referenceHref(payment);
  const wallet = walletBeforeAfter(payment);
  const movement = describeMovement(payment.description);

  const facts: [string, string][] = [
    ["Type", ENTRY_TYPE_LABELS[payment.entryType]],
    ["Amount", formatMinor(payment.amountMinor)],
    ["Reference", referenceLabel(payment)],
    ["Provider ref.", payment.providerRef ?? "Internal"],
    [
      "Created",
      new Date(payment.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    ],
  ];

  return (
    <div className="grid gap-x-8 gap-y-5 bg-surface-sub px-5 py-4 md:grid-cols-3">
      <div>
        <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          Transaction
        </h3>
        <dl className="m-0 mt-2.5 flex flex-col gap-2 text-sub">
          {facts.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-3">
              <dt className="w-28 shrink-0 text-ink-muted">{label}</dt>
              <dd className="m-0 min-w-0 break-words text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          Wallet · {payment.companyName}
        </h3>
        {wallet === null ? (
          <p className="m-0 mt-2.5 text-sub text-ink-muted">
            This never reached the wallet, so no balance changed.
          </p>
        ) : (
          <>
            <dl className="m-0 mt-2.5 flex flex-col gap-2 text-sub">
              <div className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-ink-muted">Available</dt>
                <dd className="m-0 flex items-baseline gap-2 tabular-nums">
                  <span className="text-ink-muted">
                    {formatMinor(wallet.availableBefore)}
                  </span>
                  <span aria-hidden="true" className="text-ink-faint">
                    →
                  </span>
                  <span className="font-[650] text-ink">
                    {formatMinor(wallet.availableAfter)}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-ink-muted">Reserved</dt>
                <dd className="m-0 flex items-baseline gap-2 tabular-nums">
                  <span className="text-ink-muted">
                    {formatMinor(wallet.reservedBefore)}
                  </span>
                  <span aria-hidden="true" className="text-ink-faint">
                    →
                  </span>
                  <span className="font-[650] text-ink">
                    {formatMinor(wallet.reservedAfter)}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="m-0 mt-2.5 text-meta text-ink-muted">
              Balances immediately before and after this transaction.
            </p>
          </>
        )}
      </div>

      <div>
        <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          Related Records
        </h3>
        <ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0 text-sub">
          <li className="flex items-baseline justify-between gap-3">
            <span className="text-ink-muted">Company</span>
            <Link
              href={adminCompanyPath({
                id: payment.companyUserId,
                serialNumber: payment.companySerialNumber,
              })}
              className="truncate font-medium text-blue-ink hover:underline"
            >
              {payment.companyName}
            </Link>
          </li>
          {payment.referenceType && (
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-ink-muted">
                {REFERENCE_LABELS[payment.referenceType] ??
                  payment.referenceType}
              </span>
              {href ? (
                <Link
                  href={href}
                  className="truncate font-medium text-blue-ink hover:underline"
                >
                  {referenceLabel(payment)}
                </Link>
              ) : (
                <span className="truncate text-ink">
                  {referenceLabel(payment)}
                </span>
              )}
            </li>
          )}
          {payment.referenceLabel && (
            <li className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-ink-muted">About</span>
              <span className="truncate text-ink">
                {payment.referenceLabel}
              </span>
            </li>
          )}
        </ul>
        {movement && (
          <p className="m-0 mt-3 rounded-sm bg-surface px-3 py-2 text-meta text-ink-body shadow-e1">
            {movement}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Money coming in from companies and how it moves inside their wallets.
 *
 * Two tables feed it: a deposit exists as a provider transaction before the
 * wallet is ever credited, so pending and failed ones are rows here with no
 * ledger entry behind them — which is why a row can honestly report that it
 * changed nothing.
 */
export function CompanyPaymentsBoard({
  companyProfileId,
  companyName,
}: {
  /** Restricts the board to one company — a deep-link from its detail page. */
  companyProfileId?: string;
  companyName?: string;
} = {}) {
  const [view, setView] = useState<PaymentView>("all");
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [status, setStatus] = useState("");
  const [linkedTo, setLinkedTo] = useState("");
  const [withinDays, setWithinDays] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const q = useDebouncedValue(qInput, 300);

  const days = withinDays ? Number(withinDays) : undefined;
  const filters = {
    view,
    q: q || undefined,
    status: status || undefined,
    linkedTo: linkedTo || undefined,
    companyProfileId,
    withinDays: days,
  };
  const params = { ...filters, page, limit: DEFAULT_PAGE_SIZE };
  const { data, isPending, isError, refetch } = useAdminPayments(params);
  const counts = usePaymentCounts(params);
  const summary = usePaymentsSummary(days);
  const exportCsv = useCsvExport("payments", fetchPaymentsCsv);

  const rows = data?.data ?? [];
  const hasFilters =
    qInput !== "" ||
    status !== "" ||
    linkedTo !== "" ||
    withinDays !== "" ||
    view !== "all";

  const resetFilters = (): void => {
    setQInput("");
    setStatus("");
    setLinkedTo("");
    setWithinDays("");
    setView("all");
    setPage(1);
  };
  const applyFilter =
    (set: (next: string) => void) =>
    (next: string): void => {
      set(next);
      setPage(1);
    };

  const band = summary.data;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Company Payments"
        subtitle={
          <>
            Money coming in from companies and how it moves inside their
            wallets. Recruiter commissions are in{" "}
            <Link
              href="/admin/payouts"
              className="font-medium text-blue-ink hover:underline"
            >
              Recruiter Payouts
            </Link>
            .
          </>
        }
        actions={
          <FinanceHeaderActions
            withinDays={withinDays}
            onWithinDays={applyFilter(setWithinDays)}
            onExport={() => exportCsv.mutate(filters)}
            exporting={exportCsv.isPending}
          />
        }
      />

      {companyProfileId && (
        <ScopeChip
          label={`Company: ${companyName || "Selected company"}`}
          clearHref="/admin/payments"
          clearLabel="Clear company filter"
        />
      )}

      <QuickViewBand
        label="Wallet summary"
        views={[
          {
            key: "balance",
            label: "Total Wallet Balance",
            value: band ? formatMinor(band.balanceMinor) : "—",
            note: band
              ? `Across ${band.fundedWallets} funded company wallet${band.fundedWallets === 1 ? "" : "s"}`
              : "Every company wallet, added up",
            tone: "neutral",
          },
          {
            key: "available",
            label: "Available Funds",
            value: band ? formatMinor(band.availableMinor) : "—",
            note: "Free for companies to reserve against new jobs",
            tone: "ok",
          },
          {
            key: "reserved",
            label: "Reserved Funds",
            value: band ? formatMinor(band.reservedMinor) : "—",
            note: "Held for live jobs and placements in guarantee",
            tone: "info",
          },
          {
            key: "refunded",
            label: `Refunded · ${windowLabel(days)}`,
            value: band ? formatMinor(band.refundedMinor) : "—",
            note: band
              ? `${band.refundCount} refund${band.refundCount === 1 ? "" : "s"} from resolved disputes`
              : "Returned to companies after a dispute",
            tone: "neutral",
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
            placeholder="Transaction ID, company or reference"
            className="max-w-[340px] flex-1"
          />
          <ToolbarSelect
            label="Type"
            value={view === "all" ? "" : view}
            onChange={(next) => {
              setView(next === "" ? "all" : toPaymentView(next));
              setPage(1);
              setExpandedId(null);
            }}
            allLabel={`All types${counts.data ? ` (${counts.data.all})` : ""}`}
            options={PAYMENT_VIEWS.filter(
              (option): option is Exclude<PaymentView, "all"> =>
                option !== "all",
            ).map((option) => ({
              value: option,
              // The count rides in the label — a select has nowhere else to put
              // it, and the tabs it replaces carried one each.
              label: counts.data
                ? `${PAYMENT_VIEW_LABELS[option]} (${counts.data[VIEW_COUNT[option]]})`
                : PAYMENT_VIEW_LABELS[option],
            }))}
          />
          <ToolbarSelect
            label="Status"
            value={status}
            onChange={applyFilter(setStatus)}
            allLabel="Any status"
            options={STATUS_OPTIONS}
          />
          <ToolbarSelect
            label="Linked to"
            value={linkedTo}
            onChange={applyFilter(setLinkedTo)}
            allLabel="Linked to anything"
            options={LINKED_OPTIONS}
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
                <div className="h-3.5 w-24 animate-pulse rounded-xs bg-surface-sunken" />
                <div className="h-3.5 w-1/5 animate-pulse rounded-xs bg-surface-sunken" />
                <div className="ml-auto h-3.5 w-20 animate-pulse rounded-xs bg-surface-sunken" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="m-5 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
            <div className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px] shrink-0" />
              Could not load company payments.
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
            icon={Wallet2}
            title="No transactions here"
            description="Nothing matches this view right now."
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
                    <th className={TABLE_TH}>Transaction</th>
                    <th className={TABLE_TH}>Company</th>
                    <th className={TABLE_TH}>Type</th>
                    <th className={TABLE_TH}>Reference</th>
                    <th className={cn(TABLE_TH, "text-right")}>Amount</th>
                    <th className={TABLE_TH}>Wallet Effect</th>
                    <th className={TABLE_TH}>Status</th>
                    <th className={TABLE_TH}>Date</th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {rows.map((payment) => {
                    const expanded = expandedId === payment.id;
                    const effect = walletEffect(payment);
                    const when = formatWhen(payment.createdAt);
                    return (
                      <Fragment key={payment.id}>
                        <tr className={cn(TABLE_ROW, expanded && "bg-tint")}>
                          <td className={TABLE_TD}>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              onClick={() =>
                                setExpandedId(expanded ? null : payment.id)
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
                              {transactionRef(payment)}
                            </button>
                          </td>
                          <td className={TABLE_TD}>
                            <Link
                              href={adminCompanyPath({
                                id: payment.companyUserId,
                                serialNumber: payment.companySerialNumber,
                              })}
                              className={cn(
                                TABLE_CELL_MAIN,
                                "hover:text-blue-ink hover:underline",
                              )}
                            >
                              {payment.companyName}
                            </Link>
                          </td>
                          <td className={TABLE_TD}>
                            {ENTRY_TYPE_LABELS[payment.entryType]}
                          </td>
                          <td className={TABLE_TD_STACKED}>
                            <span className={TABLE_CELL_MAIN}>
                              {referenceLabel(payment)}
                            </span>
                            <span className={cn("block", TABLE_CELL_SUB)}>
                              {payment.referenceLabel ??
                                (payment.referenceType
                                  ? (REFERENCE_LABELS[payment.referenceType] ??
                                    payment.referenceType)
                                  : "—")}
                            </span>
                          </td>
                          <td
                            className={cn(
                              TABLE_TD,
                              "text-right font-[650] tabular-nums text-ink",
                            )}
                          >
                            {formatMinor(payment.amountMinor)}
                          </td>
                          <td className={cn(TABLE_TD, effect.className)}>
                            {effect.label}
                          </td>
                          <td className={TABLE_TD}>
                            <StatusBadge
                              label={PAYMENT_STATUS_LABELS[payment.status]}
                              tone={PAYMENT_STATUS_TONES[payment.status]}
                            />
                          </td>
                          <td className={TABLE_TD_STACKED}>
                            <span className={TABLE_CELL_MAIN}>{when.day}</span>
                            <span
                              className={cn(
                                "block tabular-nums",
                                TABLE_CELL_SUB,
                              )}
                            >
                              {when.time}
                            </span>
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <PaymentDetail payment={payment} />
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
    </div>
  );
}
