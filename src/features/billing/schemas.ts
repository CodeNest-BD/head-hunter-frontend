import { z } from "zod";

export const walletSummarySchema = z.object({
  balanceMinor: z.number(),
  reservedMinor: z.number(),
  availableMinor: z.number(),
  currency: z.string(),
});
export type WalletSummary = z.infer<typeof walletSummarySchema>;

export const ledgerEntrySchema = z.object({
  id: z.string(),
  entryType: z.enum([
    "credit",
    "debit",
    "reserve",
    "release_reserve",
    "hold",
    "release_hold",
    "refund",
    "payout",
  ]),
  amountMinor: z.number(),
  balanceAfterMinor: z.number(),
  reservedAfterMinor: z.number(),
  referenceType: z.string(),
  referenceId: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const checkoutUrlSchema = z.object({ url: z.string().url() });

export const subscriptionStatusSchema = z.object({
  status: z.enum(["none", "incomplete", "active", "past_due", "canceled"]),
  currentPeriodEnd: z.string().nullable(),
});
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const recruiterPriceSchema = z.object({
  amountMinor: z.number().nullable(),
  currency: z.string(),
});
export type RecruiterPrice = z.infer<typeof recruiterPriceSchema>;

export const placementStatusSchema = z.enum([
  "held",
  "disputed",
  "releasing",
  "released",
  "refunded",
]);
export type PlacementStatus = z.infer<typeof placementStatusSchema>;

export const PLACEMENT_STATUS_LABELS: Record<PlacementStatus, string> = {
  held: "In escrow",
  disputed: "In dispute",
  releasing: "Releasing",
  released: "Paid out",
  refunded: "Refunded",
};

export const recruiterWalletSummarySchema = z.object({
  totalMinor: z.number(),
  releasedMinor: z.number(),
  /** Commission released within the current calendar year. */
  earnedYtdMinor: z.number(),
  inEscrowMinor: z.number(),
  inDisputeMinor: z.number(),
  placementsCount: z.number(),
  nextReleaseAt: z.string().nullable(),
  // Payout fields ship with the payout backend; optional so wallets parsed
  // from the current API keep working during the rollout window. Deliberately
  // NOT defaulted from releasedMinor: a missing figure must read as "unknown"
  // (withdrawing stays locked), never as "everything released is available" —
  // overstating a withdrawable balance is a money-visible bug.
  availableMinor: z.number().optional(),
  pendingPayoutMinor: z.number().optional(),
});
export type RecruiterWalletSummary = z.infer<
  typeof recruiterWalletSummarySchema
>;

export const recruiterPlacementSchema = z.object({
  placementId: z.string(),
  companyName: z.string(),
  jobTitle: z.string(),
  candidateName: z.string(),
  amountMinor: z.number(),
  status: placementStatusSchema,
  joiningDate: z.string(),
  holdExpiresAt: z.string(),
  releasedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type RecruiterPlacement = z.infer<typeof recruiterPlacementSchema>;

/** The company's side of a placement — the escrow it is funding. */
export const companyPlacementSchema = z.object({
  placementId: z.string(),
  candidateId: z.string(),
  jobTitle: z.string(),
  candidateName: z.string(),
  recruiterName: z.string(),
  amountMinor: z.number(),
  status: placementStatusSchema,
  joiningDate: z.string(),
  holdExpiresAt: z.string(),
  releasedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type CompanyPlacement = z.infer<typeof companyPlacementSchema>;

export const LEDGER_TYPE_LABELS: Record<LedgerEntry["entryType"], string> = {
  credit: "Funds added",
  debit: "Funds spent",
  reserve: "Fee reserved",
  release_reserve: "Reservation released",
  hold: "Held in escrow",
  release_hold: "Escrow released",
  refund: "Refund",
  payout: "Payout",
};

/** Public commission floor for publishing a job (minor units). */
export const minRecruiterFeeResponseSchema = z.object({
  amountMinor: z.number(),
});
export type MinRecruiterFeeResponse = z.infer<
  typeof minRecruiterFeeResponseSchema
>;

/**
 * The recruiter's Stripe Connect payout account. `none` means setup was never
 * started; `onboarding` that a Stripe account exists but the account-link flow
 * wasn't finished; `restricted` that Stripe disabled payouts after
 * verification (disabledReason says why).
 */
export const payoutAccountSchema = z
  .object({
    status: z.enum([
      "none",
      "onboarding",
      "pending_verification",
      "verified",
      "restricted",
    ]),
    bankName: z.string().nullable(),
    bankLast4: z.string().nullable(),
    disabledReason: z.string().nullable(),
    needsIdentity: z.boolean().optional(),
    needsBank: z.boolean().optional(),
  })
  .transform((account) => ({
    ...account,
    // A backend that predates these fields must fail SAFE: assume a step is
    // still needed unless the account state proves otherwise. Defaulting to
    // "done" would skip the KYC step and attach a bank to an account with no
    // identity on file.
    needsIdentity: account.needsIdentity ?? account.status !== "verified",
    needsBank: account.needsBank ?? account.bankLast4 === null,
  }));
export type PayoutAccount = z.infer<typeof payoutAccountSchema>;

/**
 * The smallest withdrawal we accept, in minor units ($50) — below it the
 * per-transfer overhead outweighs the payout. Mirrors the backend's floor;
 * becomes an admin-configured, fetched value in a later phase (see
 * docs/recruiter-payouts-plan.md §3.2), at which point this constant goes away.
 */
export const MIN_PAYOUT_MINOR = 50_00;

export const payoutStatusSchema = z.enum([
  "pending",
  "processing",
  "paid",
  "failed",
  "canceled",
]);
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
};

/** One withdrawal from the recruiter's balance to their bank. */
export const payoutSchema = z.object({
  id: z.string(),
  amountMinor: z.number(),
  status: payoutStatusSchema,
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
});
export type Payout = z.infer<typeof payoutSchema>;
