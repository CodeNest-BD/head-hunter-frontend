import {
  formatDate,
  formatDateTime,
  formatMonthDay,
} from "@/shared/utils/formatDate";
import type { Payout, PayoutAccount } from "./schemas";

/** The bank line shown under amounts, e.g. "Chase •••• 6789". */
export function bankLabel(account: PayoutAccount): string {
  if (!account.bankLast4) return "Bank account connected";
  return account.bankName
    ? `${account.bankName} •••• ${account.bankLast4}`
    : `Bank account •••• ${account.bankLast4}`;
}

/**
 * The short, support-friendly handle for a payout: the id's first block is
 * unique enough to find the row while fitting in a receipt line.
 */
export function payoutReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}

// ACH transfers settle in 2–3 business days; the window quoted everywhere in
// the payout UI.
const ARRIVAL_BUSINESS_DAYS_MIN = 2;
const ARRIVAL_BUSINESS_DAYS_MAX = 3;

/** The one phrase every payout surface quotes for the arrival promise. */
export const ARRIVAL_WINDOW_LABEL = `${ARRIVAL_BUSINESS_DAYS_MIN}–${ARRIVAL_BUSINESS_DAYS_MAX} business days`;

/**
 * One line of context per status — the table-row companion to the dialog's
 * timeline, derived from the same constants so the two can never quote
 * different promises. Exhaustive so no state shows stale copy.
 */
export function payoutDetail(payout: Payout): string {
  switch (payout.status) {
    case "pending":
    case "processing":
      return `Arrives in ${ARRIVAL_WINDOW_LABEL}`;
    case "paid":
      return payout.paidAt ? `Paid ${formatDate(payout.paidAt)}` : "Paid";
    case "failed":
      return payout.failureReason ?? "Returned by the bank — balance restored.";
    case "canceled":
      return "Canceled — balance restored.";
  }
}

export type PayoutTimelineState =
  | "done"
  | "current"
  | "upcoming"
  | "failed"
  | "canceled";

export interface PayoutTimelineStep {
  title: string;
  detail: string;
  state: PayoutTimelineState;
}

/**
 * A payout's status collapsed into the tracking timeline the dialog renders —
 * every status maps to a complete story (what happened, what's next), so the
 * recruiter never has to interpret a bare status word.
 */
export function payoutTimeline(payout: Payout): PayoutTimelineStep[] {
  const requested: PayoutTimelineStep = {
    title: "Requested",
    detail: formatDateTime(payout.createdAt),
    state: "done",
  };
  const created = new Date(payout.createdAt);
  const arrivalWindow = `${formatMonthDay(
    addBusinessDays(created, ARRIVAL_BUSINESS_DAYS_MIN),
  )} – ${formatMonthDay(addBusinessDays(created, ARRIVAL_BUSINESS_DAYS_MAX))}`;
  const balanceRestored: PayoutTimelineStep = {
    title: "Balance Restored",
    detail: "The full amount is back in your available balance.",
    state: "done",
  };

  switch (payout.status) {
    case "pending":
      return [
        requested,
        {
          title: "Sent to Your Bank",
          detail: "We're handing the transfer to your bank.",
          state: "current",
        },
        {
          title: "Arrived",
          detail: `Expected ${arrivalWindow}`,
          state: "upcoming",
        },
      ];
    case "processing":
      return [
        requested,
        {
          title: "Sent to Your Bank",
          detail: "The transfer is on its way.",
          state: "done",
        },
        {
          title: "Arrived",
          detail: `Expected ${arrivalWindow}`,
          state: "current",
        },
      ];
    case "paid":
      return [
        requested,
        {
          title: "Sent to Your Bank",
          detail: "The transfer was sent.",
          state: "done",
        },
        {
          title: "Arrived",
          detail: payout.paidAt ? `Paid ${formatDate(payout.paidAt)}` : "Paid",
          state: "done",
        },
      ];
    case "failed":
      return [
        requested,
        {
          title: "Failed",
          detail: payout.failureReason ?? "The bank returned the transfer.",
          state: "failed",
        },
        balanceRestored,
      ];
    case "canceled":
      return [
        requested,
        {
          title: "Canceled",
          detail: "The withdrawal was canceled before it was sent.",
          state: "canceled",
        },
        balanceRestored,
      ];
  }
}
