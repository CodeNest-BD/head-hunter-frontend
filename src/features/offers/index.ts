"use client";

// The barrel is a client boundary: it re-exports hooks that use client-only
// React APIs, so a Server Component importing this file must not pull them
// into the server graph.
/** Public surface of the offers feature. */
export {
  useAcceptOffer,
  useCounterOffer,
  useCreateOffer,
  useDeclineOffer,
  useOffer,
  useOffers,
  useWithdrawOffer,
} from "./hooks/useOffers";
export { offerKeys } from "./keys";
export {
  OFFER_STATUS_LABELS,
  OFFER_STATUSES,
  offerStatusSchema,
  sendOfferFormSchema,
} from "./schemas";
export type {
  Offer,
  OfferParty,
  OfferStatus,
  PlacementDetails,
  SendOfferFormValues,
} from "./schemas";
