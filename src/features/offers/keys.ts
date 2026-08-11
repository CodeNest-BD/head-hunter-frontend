import type { OfferListParams } from "./api/offers";

export const offerKeys = {
  all: ["offers"] as const,
  list: (params: OfferListParams) => ["offers", "list", params] as const,
  detail: (id: string) => ["offers", "detail", id] as const,
};
