import type { PillTone } from "@/shared/ui-components/badges/Pill";

import type { PayoutStatus, PlacementStatus } from "./schemas";

/**
 * The semantic tone each money-movement status wears. Shared by the company's
 * placements panel, the recruiter's wallet and the payout dialog, so the same
 * placement never wears two different colors on two screens.
 */
export const PLACEMENT_STATUS_TONES: Record<PlacementStatus, PillTone> = {
  released: "ok",
  held: "warn",
  releasing: "info",
  disputed: "bad",
  refunded: "neutral",
};

export const PAYOUT_STATUS_TONES: Record<PayoutStatus, PillTone> = {
  pending: "warn",
  processing: "info",
  paid: "ok",
  failed: "bad",
  canceled: "neutral",
};
