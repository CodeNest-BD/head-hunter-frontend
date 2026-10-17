import { adminDisputePath, adminPayoutPath } from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import type { AdminPayment, AdminPayout } from "../schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WalletEffect {
  label: string;
  /** The tone class for the cell — green for money arriving, grey for none. */
  className: string;
}

/**
 * What a row did to the wallet, read off the deltas the server computed.
 *
 * Deriving this from `entryType` here would mean re-implementing the ledger's
 * own rules in the client, where they could drift from the ones that actually
 * moved the money. The deltas are the fact; this only words them.
 */
export function walletEffect(payment: AdminPayment): WalletEffect {
  const { balanceDeltaMinor: balance, reservedDeltaMinor: reserved } = payment;
  if (payment.status === "failed") {
    return { label: "No change", className: "text-ink-faint" };
  }
  if (payment.status === "pending") {
    return { label: "On confirmation", className: "text-ink-muted" };
  }
  if (balance === 0 && reserved > 0) {
    return { label: "Available → Reserved", className: "text-blue-ink" };
  }
  if (balance === 0 && reserved < 0) {
    return { label: "Reserved → Available", className: "text-ok" };
  }
  if (balance < 0 && reserved < 0) {
    return {
      label: `−${formatMinor(Math.abs(balance))} settled`,
      className: "text-ink-body",
    };
  }
  if (balance > 0) {
    return {
      label: `+${formatMinor(balance)} available`,
      className: "text-ok",
    };
  }
  if (balance < 0) {
    return {
      label: `−${formatMinor(Math.abs(balance))} available`,
      className: "text-ink-body",
    };
  }
  return { label: "No change", className: "text-ink-faint" };
}

/**
 * The wallet's available and reserved totals either side of one row. Returns
 * null for a row that never reached a wallet — it did not set the balances to
 * zero, it never set them, and reporting zeroes would read as an emptied
 * wallet.
 */
export function walletBeforeAfter(payment: AdminPayment): {
  availableBefore: number;
  availableAfter: number;
  reservedBefore: number;
  reservedAfter: number;
} | null {
  const { balanceAfterMinor, reservedAfterMinor } = payment;
  if (balanceAfterMinor === null || reservedAfterMinor === null) return null;

  const availableAfter = balanceAfterMinor - reservedAfterMinor;
  const availableDelta = payment.balanceDeltaMinor - payment.reservedDeltaMinor;
  return {
    availableBefore: availableAfter - availableDelta,
    availableAfter,
    reservedBefore: reservedAfterMinor - payment.reservedDeltaMinor,
    reservedAfter: reservedAfterMinor,
  };
}

/**
 * How far off eligibility is, in the words a reader uses. A past date says how
 * long the money has been due, which is what an admin scans the On hold tab
 * for.
 */
export function countdown(iso: string): { label: string; overdue: boolean } {
  const days = Math.round(
    (new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      DAY_MS,
  );
  if (days === 0) return { label: "Today", overdue: false };
  if (days === 1) return { label: "Tomorrow", overdue: false };
  if (days > 1) return { label: `In ${days} days`, overdue: false };
  if (days === -1) return { label: "Yesterday", overdue: true };
  return { label: `${Math.abs(days)} days ago`, overdue: true };
}

/**
 * What is stopping a commission, for the Hold Reason column, and where a
 * reader should go to do something about it. Null when nothing is holding it —
 * an empty cell is the honest answer, not "None".
 *
 * A dispute hold points at the case, because resolving the dispute is what
 * clears it. A manual hold points at the payout page, because that is the only
 * place it can be lifted. With both, the payout page wins: it lists them all
 * and links on to the dispute itself.
 */
export function holdSummary(payout: AdminPayout): {
  label: string;
  detail: string;
  href: string;
} | null {
  const { openDisputeId, openDisputeSerialNumber, manualHoldCount } = payout;
  const payoutHref = adminPayoutPath({
    id: payout.placementId,
    serialNumber: payout.placementSerialNumber,
  });

  if (openDisputeId !== null && manualHoldCount > 0) {
    return {
      label: `${manualHoldCount + 1} holds`,
      detail: `DSP-${openDisputeSerialNumber} + manual`,
      href: payoutHref,
    };
  }
  if (openDisputeId !== null) {
    return {
      label: `Dispute DSP-${openDisputeSerialNumber}`,
      detail: "Clears when resolved",
      href: adminDisputePath({
        id: openDisputeId,
        serialNumber: openDisputeSerialNumber ?? undefined,
      }),
    };
  }
  if (manualHoldCount > 0) {
    return {
      label:
        manualHoldCount === 1
          ? "Manual hold"
          : `${manualHoldCount} manual holds`,
      detail: "Lifted by an admin",
      href: payoutHref,
    };
  }
  return null;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** "on placement <uuid>", "placement <uuid>", or a bare id left on its own. */
const PLACEMENT_REF = new RegExp(
  `(?:\\bon\\s+)?(?:\\bplacement\\s+)?${UUID}`,
  "gi",
);

/** What the old descriptions led with before getting to the point. */
const LEGACY_PREFIX = /^recruiter fee\s+/i;

const TRIM_DASHES = /^[\s—–-]+|[\s—–-]+$/g;

/**
 * Why the money moved — the one thing on a movement that the row does not
 * already say somewhere else.
 *
 * Descriptions used to be whole sentences that restated the entry type and
 * named the placement by UUID: "Recruiter fee released to recruiter —
 * placement 89b6e914-… guarantee passed". Type is a column, the placement is
 * a link, and the UUID is noise now that placements carry serial numbers, so
 * the only part worth reading was the cause.
 *
 * The source copy is now that cause alone. The ledger is append-only, though,
 * so every row written before keeps its sentence for good. Reducing one takes
 * three steps in this order: drop the placement reference, then trim the dash
 * it may have left dangling, and only then split — because "held in escrow —
 * placement <uuid>" has nothing after the dash once the reference is gone,
 * and splitting first would throw the whole reason away.
 *
 * A description that never carried the lead-in is returned untouched, so this
 * cannot truncate a reason that happens to contain a dash.
 */
export function describeMovement(description: string | null): string | null {
  if (!description) return null;

  const withoutRef = description
    .replace(PLACEMENT_REF, "")
    .replace(/\s+/g, " ")
    .replace(TRIM_DASHES, "")
    .trim();

  if (!LEGACY_PREFIX.test(withoutRef)) {
    return withoutRef.length > 0 ? withoutRef : null;
  }

  const body = withoutRef.replace(LEGACY_PREFIX, "");
  const dash = body.search(/[—–-]/);
  const after = dash === -1 ? "" : body.slice(dash + 1).trim();
  // Keep what follows the dash when the sentence got that far; otherwise the
  // lead-in was the whole of it, and it is still better than nothing.
  const cause = (after.length > 0 ? after : body).replace(TRIM_DASHES, "");

  if (cause.length === 0) return null;
  return cause.charAt(0).toUpperCase() + cause.slice(1);
}
