import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  checkoutUrlSchema,
  ledgerEntrySchema,
  onboardingLinkSchema,
  payoutAccountSchema,
  recruiterPlacementSchema,
  recruiterPriceSchema,
  recruiterWalletSummarySchema,
  subscriptionStatusSchema,
  walletSummarySchema,
  type LedgerEntry,
  type PayoutAccount,
  type RecruiterPlacement,
  type RecruiterPrice,
  type RecruiterWalletSummary,
  type SubscriptionStatus,
  type WalletSummary,
} from "../schemas";

/** GET /v1/billing/wallet */
export async function fetchWallet(): Promise<WalletSummary> {
  const { data } = await apiClient.get<unknown>("/billing/wallet");
  return walletSummarySchema.parse(data);
}

/** GET /v1/billing/wallet/ledger */
export async function fetchLedger(
  page: number,
): Promise<Paginated<LedgerEntry>> {
  const { data } = await apiClient.get<unknown>("/billing/wallet/ledger", {
    params: { page, limit: 20 },
  });
  return paginatedSchema(ledgerEntrySchema).parse(data);
}

/** POST /v1/billing/wallet/top-up — returns the Stripe Checkout URL. */
export async function createTopUpCheckout(
  amountMinor: number,
): Promise<string> {
  const { data } = await apiClient.post<unknown>("/billing/wallet/top-up", {
    amountMinor,
  });
  return checkoutUrlSchema.parse(data).url;
}

/** GET /v1/billing/subscription */
export async function fetchSubscription(): Promise<SubscriptionStatus> {
  const { data } = await apiClient.get<unknown>("/billing/subscription");
  return subscriptionStatusSchema.parse(data);
}

/** GET /v1/billing/recruiter-price — public: the current subscription price. */
export async function fetchRecruiterPrice(): Promise<RecruiterPrice> {
  const { data } = await apiClient.get<unknown>("/billing/recruiter-price");
  return recruiterPriceSchema.parse(data);
}

/** GET /v1/recruiter/payout-account — Stripe Connect onboarding state. */
export async function fetchPayoutAccount(
  refresh = false,
): Promise<PayoutAccount> {
  const { data } = await apiClient.get<unknown>("/recruiter/payout-account", {
    params: refresh ? { refresh: "true" } : undefined,
  });
  return payoutAccountSchema.parse(data);
}

/** POST /v1/recruiter/payout-account — returns the Stripe onboarding URL. */
export async function createPayoutOnboarding(): Promise<string> {
  const { data } = await apiClient.post<unknown>("/recruiter/payout-account");
  return onboardingLinkSchema.parse(data).url;
}

/** GET /v1/recruiter/wallet — the recruiter's earnings summary. */
export async function fetchRecruiterWallet(): Promise<RecruiterWalletSummary> {
  const { data } = await apiClient.get<unknown>("/recruiter/wallet");
  return recruiterWalletSummarySchema.parse(data);
}

export interface PlacementsParams {
  page: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** GET /v1/recruiter/wallet/placements — the recruiter's placement history. */
export async function fetchRecruiterPlacements(
  params: PlacementsParams,
): Promise<Paginated<RecruiterPlacement>> {
  const { data } = await apiClient.get<unknown>(
    "/recruiter/wallet/placements",
    {
      params: {
        page: params.page,
        limit: params.limit ?? 25,
        ...(params.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
      },
    },
  );
  return paginatedSchema(recruiterPlacementSchema).parse(data);
}

/** POST /v1/billing/subscription/checkout — returns the Stripe Checkout URL. */
export async function createSubscriptionCheckout(): Promise<string> {
  const { data } = await apiClient.post<unknown>(
    "/billing/subscription/checkout",
  );
  return checkoutUrlSchema.parse(data).url;
}

/** POST /v1/billing/subscription/portal — returns the Stripe portal URL. */
export async function createSubscriptionPortal(): Promise<string> {
  const { data } = await apiClient.post<unknown>(
    "/billing/subscription/portal",
  );
  return checkoutUrlSchema.parse(data).url;
}
