import { apiClient } from "@/shared/libs/apiClient";
import { publicJobStatsSchema, type PublicJobStats } from "../publicSchemas";

/** GET /v1/public/jobs/stats — the landing stats strip. */
export async function fetchPublicJobStats(): Promise<PublicJobStats> {
  const { data } = await apiClient.get<unknown>("/public/jobs/stats", {
    suppressGlobalErrorToast: true,
  });
  return publicJobStatsSchema.parse(data);
}
