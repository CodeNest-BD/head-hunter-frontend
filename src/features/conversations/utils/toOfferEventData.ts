import type { Offer } from "@/features/offers";
import type { OfferEventData } from "../components/OfferCard";

/**
 * REST `Offer` → the shape `OfferCard` renders. Salary, job title and start
 * date live in the offer's `placementDetails` jsonb, so each is nullable
 * here exactly as it is nullable there — null when the blob itself is null
 * or the key absent.
 */
export function toOfferEventData(offer: Offer): OfferEventData {
  return {
    kind: "offer",
    offerId: offer.id,
    offerStatus: offer.status,
    amountMinor: offer.amountMinor,
    salaryMinor: offer.placementDetails?.salaryMinor ?? null,
    jobTitle: offer.placementDetails?.jobTitle ?? null,
    startDate: offer.placementDetails?.startDate ?? null,
    previousOfferId: offer.previousOfferId,
    createdBy: offer.createdBy,
  };
}
