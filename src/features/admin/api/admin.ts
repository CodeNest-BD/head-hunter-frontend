import type { ThreadSortOrder } from "@/features/conversations/api/conversations";
import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import type { AdminListParams } from "../keys";
import {
  accountStatusResponseSchema,
  adminJobListItemSchema,
  adminStatsSchema,
  adminUserSchema,
  companyDetailSchema,
  companyListItemSchema,
  conversationListItemSchema,
  conversationThreadSchema,
  recruiterDetailSchema,
  recruiterListItemSchema,
  minRecruiterFeeSchema,
  recruiterPricingSchema,
  type AccountStatus,
  type AdminJobListItem,
  type AdminUser,
  type CompanyDetail,
  type CompanyListItem,
  type ConversationListItem,
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
    ...(params.companyProfileId
      ? { companyProfileId: params.companyProfileId }
      : {}),
    ...(params.recruiterProfileId
      ? { recruiterProfileId: params.recruiterProfileId }
      : {}),
  };
}

/** GET /v1/admin/stats */
export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<unknown>("/admin/stats");
  return adminStatsSchema.parse(data);
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
