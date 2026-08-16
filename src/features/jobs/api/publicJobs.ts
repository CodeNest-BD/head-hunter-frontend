import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  publicJobCardSchema,
  publicJobDetailSchema,
  publicJobStatsSchema,
  type PublicJobCard,
  type PublicJobDetail,
  type PublicJobStats,
} from "../publicSchemas";

/** Filters the public browse endpoint accepts (a guest-safe subset). */
export interface PublicJobFilterParams {
  roleCategory?: string;
  locationState?: string;
  isRemote?: boolean;
  feeMin?: number;
  feeMax?: number;
  q?: string;
}

export interface PublicJobListParams extends PublicJobFilterParams {
  page?: number;
  limit?: number;
  sortBy?: "publishedAt" | "recruiterFeeMinor";
}

/** GET /v1/public/jobs — live listings only, card-safe fields only. */
export async function fetchPublicJobs(
  params: PublicJobListParams,
): Promise<Paginated<PublicJobCard>> {
  const { data } = await apiClient.get<unknown>("/public/jobs", {
    params,
    suppressGlobalErrorToast: true,
  });
  return paginatedSchema(publicJobCardSchema).parse(data);
}

/** GET /v1/public/jobs/:id — 404s anything that is not currently live. */
export async function fetchPublicJob(id: string): Promise<PublicJobDetail> {
  const { data } = await apiClient.get<unknown>(`/public/jobs/${id}`, {
    suppressGlobalErrorToast: true,
  });
  return publicJobDetailSchema.parse(data);
}

/** GET /v1/public/jobs/stats — the landing stats strip. */
export async function fetchPublicJobStats(): Promise<PublicJobStats> {
  const { data } = await apiClient.get<unknown>("/public/jobs/stats", {
    suppressGlobalErrorToast: true,
  });
  return publicJobStatsSchema.parse(data);
}
