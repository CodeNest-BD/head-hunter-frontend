import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import type { SubmitBankInput, SubmitIdentityInput } from "../bankAccountForm";
import {
  checkoutUrlSchema,
  companyPlacementSchema,
  minRecruiterFeeResponseSchema,
  ledgerEntrySchema,
  payoutAccountSchema,
  payoutSchema,
  recruiterPlacementSchema,
  recruiterPriceSchema,
  recruiterWalletSummarySchema,
  subscriptionStatusSchema,
  walletSummarySchema,
  type CompanyPlacement,
  type LedgerEntry,
  type Payout,
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

/** GET /v1/recruiter/wallet — the recruiter's earnings summary. */
export async function fetchRecruiterWallet(): Promise<RecruiterWalletSummary> {
  const { data } = await apiClient.get<unknown>("/recruiter/wallet");
  return recruiterWalletSummarySchema.parse(data);
}

/** GET /v1/recruiter/wallet/placements — the recruiter's placement history. */
export async function fetchRecruiterPlacements(
  page: number,
): Promise<Paginated<RecruiterPlacement>> {
  const { data } = await apiClient.get<unknown>(
    "/recruiter/wallet/placements",
    {
      params: { page, limit: 20 },
    },
  );
  return paginatedSchema(recruiterPlacementSchema).parse(data);
}

/** GET /v1/company/placements — the company's escrow view. */
export async function fetchCompanyPlacements(
  page: number,
): Promise<Paginated<CompanyPlacement>> {
  const { data } = await apiClient.get<unknown>("/company/placements", {
    params: { page, limit: 20 },
  });
  return paginatedSchema(companyPlacementSchema).parse(data);
}

/**
 * POST /v1/company/placements/:id/reject — reject a hire within the 30-day
 * guarantee. Refunds the held fee and reopens the job. Returns nothing (204).
 * The inline confirmation surfaces the error, so the global toast is suppressed.
 */
export async function rejectPlacement(placementId: string): Promise<void> {
  await apiClient.post<unknown>(
    `/company/placements/${placementId}/reject`,
    undefined,
    { suppressGlobalErrorToast: true },
  );
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

/** GET /v1/recruiter/payouts/account — the recruiter's payout account. */
export async function fetchPayoutAccount(): Promise<PayoutAccount> {
  const { data } = await apiClient.get<unknown>("/recruiter/payouts/account");
  return payoutAccountSchema.parse(data);
}

/**
 * POST /v1/recruiter/payouts/account/identity — the identity step of the
 * in-app payout setup. Values are forwarded to Stripe for KYC and never
 * logged or stored. The dialog surfaces errors inline, so the global toast
 * is suppressed.
 */
export async function submitPayoutIdentity(
  input: SubmitIdentityInput,
): Promise<PayoutAccount> {
  const { data } = await apiClient.post<unknown>(
    "/recruiter/payouts/account/identity",
    input,
    { suppressGlobalErrorToast: true },
  );
  return payoutAccountSchema.parse(data);
}

/**
 * POST /v1/recruiter/payouts/account/bank — adds (or replaces) the payout
 * bank account. Same privacy handling as the identity step.
 */
export async function submitPayoutBank(
  input: SubmitBankInput,
): Promise<PayoutAccount> {
  const { data } = await apiClient.post<unknown>(
    "/recruiter/payouts/account/bank",
    input,
    { suppressGlobalErrorToast: true },
  );
  return payoutAccountSchema.parse(data);
}

/**
 * POST /v1/recruiter/payouts — withdraw from the released balance. The
 * Idempotency-Key makes an ambiguous retry (timeout, then resubmit) safe:
 * the backend returns the original payout instead of creating a second one.
 * The dialog surfaces errors inline, so the global toast is suppressed.
 */
export async function createPayout(
  amountMinor: number,
  idempotencyKey: string,
): Promise<Payout> {
  const { data } = await apiClient.post<unknown>(
    "/recruiter/payouts",
    { amountMinor },
    {
      headers: { "Idempotency-Key": idempotencyKey },
      suppressGlobalErrorToast: true,
    },
  );
  return payoutSchema.parse(data);
}

/** GET /v1/recruiter/payouts — withdrawal history, newest first. */
export async function fetchPayouts(page: number): Promise<Paginated<Payout>> {
  const { data } = await apiClient.get<unknown>("/recruiter/payouts", {
    params: { page, limit: 20 },
  });
  return paginatedSchema(payoutSchema).parse(data);
}

/**
 * GET /v1/billing/min-recruiter-fee — public: the commission floor a job
 * must offer to publish. Read by the job form for its hint.
 */
export async function fetchMinRecruiterFee(): Promise<{
  amountMinor: number;
}> {
  const { data } = await apiClient.get<unknown>("/billing/min-recruiter-fee", {
    suppressGlobalErrorToast: true,
  });
  return minRecruiterFeeResponseSchema.parse(data);
}
