import type { PillTone } from "@/shared/ui-components/badges/Pill";
import type {
  LedgerEntryType,
  PaymentStatus,
  PaymentView,
  PayoutHoldReason,
  PayoutView,
} from "../schemas";

/**
 * The wording for every raw value the finance endpoints send. The server
 * reports what happened; the labels and tones are the client's, so a copy
 * change never needs a deploy of the API.
 */

export const PAYMENT_VIEW_LABELS: Record<PaymentView, string> = {
  all: "All",
  deposits: "Deposits",
  reservations: "Reservations",
  settlements: "Fee Settlements",
  refunds: "Refunds",
  other: "Other",
  failed: "Failed",
};

export const ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  credit: "Deposit",
  debit: "Charge",
  reserve: "Fee reserved",
  release_reserve: "Reservation released",
  hold: "Fee reserved",
  release_hold: "Reservation released",
  refund: "Refund",
  payout: "Fee settled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Completed",
  failed: "Failed",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, PillTone> = {
  pending: "info",
  succeeded: "ok",
  failed: "bad",
};

/** What the referenced record is called, for the Reference column. */
export const REFERENCE_LABELS: Record<string, string> = {
  topup: "Company deposit",
  job: "Job",
  placement: "Placement",
  dispute: "Dispute",
  payout: "Payout",
  subscription: "Subscription",
};

/** The display prefix each record type's serial carries. */
export const REFERENCE_PREFIXES: Record<string, string> = {
  job: "JOB",
  placement: "PLC",
  dispute: "DSP",
};

export const PAYOUT_VIEW_LABELS: Record<PayoutView, string> = {
  all: "All",
  in_guarantee: "In Guarantee",
  ready: "Ready",
  on_hold: "On Hold",
  processing: "Processing",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYOUT_VIEW_TONES: Record<PayoutView, PillTone> = {
  all: "neutral",
  in_guarantee: "neutral",
  ready: "info",
  on_hold: "warn",
  processing: "info",
  paid: "ok",
  refunded: "neutral",
};

export const HOLD_REASON_LABELS: Record<PayoutHoldReason, string> = {
  account_review: "Account review",
  payout_account: "Payout account review",
  compliance: "Compliance check",
  other: "Other",
};

/** The recruiter's bank account as Stripe reports it. */
export const DESTINATION_STATUS_LABELS: Record<string, string> = {
  none: "Not set up",
  onboarding: "Setup unfinished",
  pending_verification: "Awaiting verification",
  verified: "Enabled",
  restricted: "Restricted",
};

export const DESTINATION_STATUS_TONES: Record<string, PillTone> = {
  none: "neutral",
  onboarding: "warn",
  pending_verification: "info",
  verified: "ok",
  restricted: "bad",
};

/** The finance boards' date range. "" is All time, the default. */
export const DATE_RANGE_OPTIONS = [
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
] as const;

/** A summary tile's window, Title Case for its header: "Last 30 Days". */
export function windowLabel(days: number | null | undefined): string {
  if (!days) return "All Time";
  return days === 365 ? "Last 12 Months" : `Last ${days} Days`;
}
