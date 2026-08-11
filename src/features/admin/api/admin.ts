import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import type { AdminListParams } from "../keys";
import {
  accountStatusResponseSchema,
  adminStatsSchema,
  companyDetailSchema,
  companyListItemSchema,
  conversationListItemSchema,
  conversationThreadSchema,
  recruiterDetailSchema,
  recruiterListItemSchema,
  type AccountStatus,
  type CompanyDetail,
  type CompanyListItem,
  type ConversationListItem,
  type AdminStats,
  type ConversationThread,
  type RecruiterDetail,
  type RecruiterListItem,
} from "../schemas";

const PAGE_SIZE = 20;

function listParams(params: AdminListParams): Record<string, unknown> {
  return {
    page: params.page,
    limit: PAGE_SIZE,
    ...(params.q ? { q: params.q } : {}),
    ...(params.status ? { status: params.status } : {}),
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

/** GET /v1/admin/conversations/:submissionId — one page of the thread, paged by the hook. */
export async function fetchConversation(
  submissionId: string,
  page: number,
): Promise<ConversationThread> {
  const { data } = await apiClient.get<unknown>(
    `/admin/conversations/${submissionId}`,
    { params: { page, limit: PAGE_SIZE } },
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
