import { z } from "zod";
import type { ThreadSortOrder } from "@/features/conversations/api/conversations";
import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import type {
  AdminListParams,
  AdminOfferListParams,
  AdminPaymentParams,
  AdminPayoutParams,
} from "../keys";
import {
  accountStatusResponseSchema,
  adminPaymentSchema,
  adminPayoutSchema,
  adminPayoutDetailSchema,
  paymentCountsSchema,
  paymentsSummarySchema,
  payoutsSummarySchema,
  adminJobListItemSchema,
  adminJobDetailSchema,
  adminOfferSchema,
  adminPlacementSchema,
  placementCountsSchema,
  adminDashboardSchema,
  adminStatsSchema,
  adminUserSchema,
  bulkJobActionResultSchema,
  companyDetailSchema,
  companyListItemSchema,
  conversationListItemSchema,
  conversationThreadSchema,
  recruiterDetailSchema,
  recruiterListItemSchema,
  minRecruiterFeeSchema,
  recruiterPricingSchema,
  type AccountStatus,
  type AdminPayment,
  type AdminPayout,
  type AdminPayoutDetail,
  type PaymentCounts,
  type PaymentsSummary,
  type PayoutHoldReason,
  type PayoutsSummary,
  type AdminJobListItem,
  type AdminJobDetail,
  type AdminOffer,
  type AdminPlacement,
  type PlacementCounts,
  type PlacementView,
  type AdminUser,
  type BulkJobActionResult,
  type CompanyDetail,
  type CompanyListItem,
  type ConversationListItem,
  type AdminDashboard,
  type AdminStats,
  type ConversationThread,
  type RecruiterDetail,
  type RecruiterListItem,
  type MinRecruiterFee,
  type RecruiterPricing,
} from "../schemas";

/** Default rows-per-page; the selector offers larger sizes for bulk review. */
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 1000] as const;

function listParams(params: AdminListParams): Record<string, unknown> {
  return {
    page: params.page,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    ...(params.q ? { q: params.q } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.verificationStatus
      ? { verificationStatus: params.verificationStatus }
      : {}),
    ...(params.rating ? { rating: params.rating } : {}),
    ...(params.state ? { state: params.state } : {}),
    ...(params.wallet ? { wallet: params.wallet } : {}),
    ...(params.industry ? { industry: params.industry } : {}),
    ...(params.activity ? { activity: params.activity } : {}),
    ...(params.jobId ? { jobId: params.jobId } : {}),
    ...(params.withinDays ? { withinDays: params.withinDays } : {}),
    ...(params.order ? { order: params.order } : {}),
    ...(params.company ? { company: params.company } : {}),
    ...(params.recruiterProfileId
      ? { recruiterProfileId: params.recruiterProfileId }
      : {}),
    ...(params.companyProfileId
      ? { companyProfileId: params.companyProfileId }
      : {}),
  };
}

/** GET /v1/admin/stats */
export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<unknown>("/admin/stats");
  return adminStatsSchema.parse(data);
}

/** GET /v1/admin/dashboard */
export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await apiClient.get<unknown>("/admin/dashboard");
  return adminDashboardSchema.parse(data);
}

/** GET /v1/admin/recruiters */
export async function fetchRecruiters(
  params: AdminListParams,
): Promise<Paginated<RecruiterListItem>> {
  const { data } = await apiClient.get<unknown>("/admin/recruiters", {
    params: listParams(params),
  });
  return paginatedSchema(recruiterListItemSchema).parse(data);
}

/** GET /v1/admin/recruiters/:userId */
export async function fetchRecruiter(userId: string): Promise<RecruiterDetail> {
  const { data } = await apiClient.get<unknown>(`/admin/recruiters/${userId}`);
  return recruiterDetailSchema.parse(data);
}

export interface VerificationDecisionInput {
  userId: string;
  status: "verified" | "rejected";
  note?: string;
}

/** PATCH /v1/admin/recruiters/:userId/verification */
export async function decideRecruiterVerification(
  input: VerificationDecisionInput,
): Promise<void> {
  await apiClient.patch(`/admin/recruiters/${input.userId}/verification`, {
    status: input.status,
    ...(input.note ? { note: input.note } : {}),
  });
}

/** PATCH /v1/admin/companies/:userId/verification */
export async function decideCompanyVerification(
  input: VerificationDecisionInput,
): Promise<void> {
  await apiClient.patch(`/admin/companies/${input.userId}/verification`, {
    status: input.status,
    ...(input.note ? { note: input.note } : {}),
  });
}

/** GET /v1/admin/companies */
export async function fetchCompanies(
  params: AdminListParams,
): Promise<Paginated<CompanyListItem>> {
  const { data } = await apiClient.get<unknown>("/admin/companies", {
    params: listParams(params),
  });
  return paginatedSchema(companyListItemSchema).parse(data);
}

/** GET /v1/admin/companies/industries */
export async function fetchCompanyIndustries(): Promise<string[]> {
  const { data } = await apiClient.get<unknown>("/admin/companies/industries");
  return z.array(z.string()).parse(data);
}

/** GET /v1/admin/companies/:userId */
export async function fetchCompany(userId: string): Promise<CompanyDetail> {
  const { data } = await apiClient.get<unknown>(`/admin/companies/${userId}`);
  return companyDetailSchema.parse(data);
}

/** GET /v1/admin/conversations */
export async function fetchConversations(
  params: AdminListParams,
): Promise<Paginated<ConversationListItem>> {
  const { data } = await apiClient.get<unknown>("/admin/conversations", {
    params: listParams(params),
  });
  return paginatedSchema(conversationListItemSchema).parse(data);
}

// Newest-first: `orderedEvents` (ConversationThread.tsx) reverses each fetched
// page to render oldest-at-top, the same convention the participant thread
// uses — sent explicitly so that rendering does not silently invert if the
// backend's own default ever changes.
const THREAD_SORT_ORDER: ThreadSortOrder = "DESC";

/** Thread events fetched per page (independent of the directory page size). */
const THREAD_PAGE_SIZE = 20;

/** GET /v1/admin/conversations/:candidateId — one page of the thread, paged by the hook. */
export async function fetchConversation(
  candidateId: string,
  page: number,
): Promise<ConversationThread> {
  const { data } = await apiClient.get<unknown>(
    `/admin/conversations/${candidateId}`,
    { params: { page, limit: THREAD_PAGE_SIZE, sortOrder: THREAD_SORT_ORDER } },
  );
  return conversationThreadSchema.parse(data);
}

/** POST /v1/admin/accounts/:userId/suspend */
export async function suspendAccount(
  userId: string,
  reason?: string,
): Promise<AccountStatus> {
  const { data } = await apiClient.post<unknown>(
    `/admin/accounts/${userId}/suspend`,
    reason ? { reason } : {},
  );
  return accountStatusResponseSchema.parse(data).status;
}

/** POST /v1/admin/accounts/:userId/reinstate */
export async function reinstateAccount(userId: string): Promise<AccountStatus> {
  const { data } = await apiClient.post<unknown>(
    `/admin/accounts/${userId}/reinstate`,
  );
  return accountStatusResponseSchema.parse(data).status;
}

/** GET /v1/admin/placements */
export async function fetchAdminPlacements(
  view: PlacementView,
  page: number,
  limit: number,
): Promise<Paginated<AdminPlacement>> {
  const { data } = await apiClient.get<unknown>("/admin/placements", {
    params: { page, limit, ...(view === "all" ? {} : { view }) },
  });
  return paginatedSchema(adminPlacementSchema).parse(data);
}

/** GET /v1/admin/placements/counts */
export async function fetchPlacementCounts(): Promise<PlacementCounts> {
  const { data } = await apiClient.get<unknown>("/admin/placements/counts");
  return placementCountsSchema.parse(data);
}

/** GET /v1/admin/offers */
export async function fetchAdminOffers(
  params: AdminOfferListParams,
): Promise<Paginated<AdminOffer>> {
  const { data } = await apiClient.get<unknown>("/admin/offers", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.q ? { q: params.q } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return paginatedSchema(adminOfferSchema).parse(data);
}

/** GET /v1/admin/jobs/:jobId */
export async function fetchAdminJob(ref: string): Promise<AdminJobDetail> {
  const { data } = await apiClient.get<unknown>(`/admin/jobs/${ref}`);
  return adminJobDetailSchema.parse(data);
}

/** GET /v1/admin/jobs */
export async function fetchJobs(
  params: AdminListParams,
): Promise<Paginated<AdminJobListItem>> {
  const { data } = await apiClient.get<unknown>("/admin/jobs", {
    params: listParams(params),
  });
  return paginatedSchema(adminJobListItemSchema).parse(data);
}

/** GET /v1/admin/settings/recruiter-pricing */
export async function fetchRecruiterPricing(): Promise<RecruiterPricing> {
  const { data } = await apiClient.get<unknown>(
    "/admin/settings/recruiter-pricing",
  );
  return recruiterPricingSchema.parse(data);
}

/** PUT /v1/admin/settings/recruiter-pricing */
export async function updateRecruiterPricing(
  amountMinor: number,
): Promise<RecruiterPricing> {
  const { data } = await apiClient.put<unknown>(
    "/admin/settings/recruiter-pricing",
    { amountMinor },
  );
  return recruiterPricingSchema.parse(data);
}

/** GET /v1/admin/settings/min-recruiter-fee */
export async function fetchMinRecruiterFeeSetting(): Promise<MinRecruiterFee> {
  const { data } = await apiClient.get<unknown>(
    "/admin/settings/min-recruiter-fee",
  );
  return minRecruiterFeeSchema.parse(data);
}

/** PUT /v1/admin/settings/min-recruiter-fee */
export async function updateMinRecruiterFee(
  amountMinor: number,
): Promise<MinRecruiterFee> {
  const { data } = await apiClient.put<unknown>(
    "/admin/settings/min-recruiter-fee",
    { amountMinor },
  );
  return minRecruiterFeeSchema.parse(data);
}

/** GET /v1/admin/admins */
export async function fetchAdmins(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<unknown>("/admin/admins");
  return adminUserSchema.array().parse(data);
}

export interface CreateAdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** POST /v1/admin/admins */
export async function createAdmin(input: CreateAdminInput): Promise<AdminUser> {
  const { data } = await apiClient.post<unknown>("/admin/admins", input);
  return adminUserSchema.parse(data);
}

/** DELETE /v1/admin/admins/:userId */
export async function removeAdmin(userId: string): Promise<void> {
  await apiClient.delete<unknown>(`/admin/admins/${userId}`);
}

/** POST /v1/admin/admins/:userId/password */
export async function changeAdminPassword(
  userId: string,
  password: string,
): Promise<void> {
  await apiClient.post<unknown>(`/admin/admins/${userId}/password`, {
    password,
  });
}

/** PATCH /v1/admin/admins/:userId */
export async function updateAdmin(
  userId: string,
  input: { firstName: string; lastName: string },
): Promise<AdminUser> {
  const { data } = await apiClient.patch<unknown>(
    `/admin/admins/${userId}`,
    input,
  );
  return adminUserSchema.parse(data);
}

/** DELETE /v1/admin/recruiters/:userId */
export async function deleteRecruiter(userId: string): Promise<void> {
  await apiClient.delete<unknown>(`/admin/recruiters/${userId}`);
}

/** PATCH /v1/admin/jobs/:jobId — admin edits any job. */
export async function updateAdminJob(
  jobId: string,
  input: Record<string, unknown>,
): Promise<void> {
  await apiClient.patch<unknown>(`/admin/jobs/${jobId}`, input);
}

/** DELETE /v1/admin/jobs/:jobId — admin deletes any job. */
export async function deleteAdminJob(jobId: string): Promise<void> {
  await apiClient.delete<unknown>(`/admin/jobs/${jobId}`);
}

/** POST /v1/admin/jobs/:jobId/repost — publish an expired listing for 30 more days. */
export async function repostAdminJob(jobId: string): Promise<void> {
  await apiClient.post<unknown>(`/admin/jobs/${jobId}/repost`);
}

/**
 * Requests per bulk call. Well under the backend's 100-id cap, and small
 * enough that each request finishes far inside proxy timeouts even when every
 * job runs its full fee/funding checks — a select-all of a 1000-row page
 * becomes a sequence of short requests with the outcomes merged.
 */
const BULK_CHUNK_SIZE = 25;

async function bulkJobAction(
  path: string,
  jobIds: string[],
): Promise<BulkJobActionResult> {
  const merged: BulkJobActionResult = { succeeded: 0, failed: [] };
  for (let start = 0; start < jobIds.length; start += BULK_CHUNK_SIZE) {
    const { data } = await apiClient.post<unknown>(path, {
      jobIds: jobIds.slice(start, start + BULK_CHUNK_SIZE),
    });
    const result = bulkJobActionResultSchema.parse(data);
    merged.succeeded += result.succeeded;
    merged.failed.push(...result.failed);
  }
  return merged;
}

/** POST /v1/admin/jobs/bulk/repost — per-item outcomes, never all-or-nothing. */
export function bulkRepostAdminJobs(
  jobIds: string[],
): Promise<BulkJobActionResult> {
  return bulkJobAction("/admin/jobs/bulk/repost", jobIds);
}

/** POST /v1/admin/jobs/bulk/delete — per-item outcomes, never all-or-nothing. */
export function bulkDeleteAdminJobs(
  jobIds: string[],
): Promise<BulkJobActionResult> {
  return bulkJobAction("/admin/jobs/bulk/delete", jobIds);
}

/* ── Finance boards ────────────────────────────────────────────────────── */

/**
 * Only the filters that are set are sent. An empty select means "no filter",
 * and sending `status=""` would narrow to rows with an empty status instead.
 */
function financeParams(
  params: AdminPaymentParams | AdminPayoutParams,
): Record<string, unknown> {
  const entries = Object.entries(params).filter(
    ([key, value]) =>
      key !== "page" &&
      key !== "limit" &&
      value !== undefined &&
      value !== "" &&
      value !== "all",
  );
  return {
    page: params.page,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    ...Object.fromEntries(entries),
  };
}

/** GET /v1/admin/payments */
export async function fetchAdminPayments(
  params: AdminPaymentParams,
): Promise<Paginated<AdminPayment>> {
  const { data } = await apiClient.get<unknown>("/admin/payments", {
    params: financeParams(params),
  });
  return paginatedSchema(adminPaymentSchema).parse(data);
}

/** GET /v1/admin/payments/counts */
export async function fetchPaymentCounts(
  params: AdminPaymentParams,
): Promise<PaymentCounts> {
  const { data } = await apiClient.get<unknown>("/admin/payments/counts", {
    params: financeParams(params),
  });
  return paymentCountsSchema.parse(data);
}

/** GET /v1/admin/payments/summary — `withinDays` windows the refund figure. */
export async function fetchPaymentsSummary(
  withinDays?: number,
): Promise<PaymentsSummary> {
  const { data } = await apiClient.get<unknown>("/admin/payments/summary", {
    params: withinDays ? { withinDays } : {},
  });
  return paymentsSummarySchema.parse(data);
}

/** GET /v1/admin/payments/export — the filtered board, every page, as CSV. */
export async function fetchPaymentsCsv(
  params: Omit<AdminPaymentParams, "page" | "limit">,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/admin/payments/export", {
    params: financeParams({ ...params, page: 1 }),
    responseType: "blob",
  });
  return data;
}

/** GET /v1/admin/payouts */
export async function fetchAdminPayouts(
  params: AdminPayoutParams,
): Promise<Paginated<AdminPayout>> {
  const { data } = await apiClient.get<unknown>("/admin/payouts", {
    params: financeParams(params),
  });
  return paginatedSchema(adminPayoutSchema).parse(data);
}

/** GET /v1/admin/payouts/summary — `withinDays` windows paid and failed. */
export async function fetchPayoutsSummary(
  withinDays?: number,
): Promise<PayoutsSummary> {
  const { data } = await apiClient.get<unknown>("/admin/payouts/summary", {
    params: withinDays ? { withinDays } : {},
  });
  return payoutsSummarySchema.parse(data);
}

/** GET /v1/admin/payouts/export — the filtered board, every page, as CSV. */
export async function fetchPayoutsCsv(
  params: Omit<AdminPayoutParams, "page" | "limit">,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/admin/payouts/export", {
    params: financeParams({ ...params, page: 1 }),
    responseType: "blob",
  });
  return data;
}

/** GET /v1/admin/payouts/:ref — `ref` is the placement serial or its id. */
export async function fetchAdminPayout(
  ref: string,
): Promise<AdminPayoutDetail> {
  const { data } = await apiClient.get<unknown>(
    `/admin/payouts/${encodeURIComponent(ref)}`,
  );
  return adminPayoutDetailSchema.parse(data);
}

export interface AddPayoutHoldInput {
  reason: PayoutHoldReason;
  note: string;
}

/** POST /v1/admin/payouts/:ref/holds */
export async function addPayoutHold(
  ref: string,
  input: AddPayoutHoldInput,
): Promise<AdminPayoutDetail> {
  const { data } = await apiClient.post<unknown>(
    `/admin/payouts/${encodeURIComponent(ref)}/holds`,
    input,
  );
  return adminPayoutDetailSchema.parse(data);
}

/** POST /v1/admin/payouts/:ref/holds/:holdId/release */
export async function releasePayoutHold(
  ref: string,
  holdId: string,
  note?: string,
): Promise<AdminPayoutDetail> {
  const { data } = await apiClient.post<unknown>(
    `/admin/payouts/${encodeURIComponent(ref)}/holds/${encodeURIComponent(holdId)}/release`,
    note ? { note } : {},
  );
  return adminPayoutDetailSchema.parse(data);
}
