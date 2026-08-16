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
  inEscrowMinor: z.number(),
  inDisputeMinor: z.number(),
  placementsCount: z.number(),
  nextReleaseAt: z.string().nullable(),
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
