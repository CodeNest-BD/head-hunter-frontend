import { apiClient } from "@/shared/libs/apiClient";

/** POST /v1/company-profiles/:id/follow → 204. Idempotent server-side. */
export async function followCompany(companyId: string): Promise<void> {
  await apiClient.post(`/company-profiles/${companyId}/follow`);
}

/** DELETE /v1/company-profiles/:id/follow → 204. Idempotent server-side. */
export async function unfollowCompany(companyId: string): Promise<void> {
  await apiClient.delete(`/company-profiles/${companyId}/follow`);
}
