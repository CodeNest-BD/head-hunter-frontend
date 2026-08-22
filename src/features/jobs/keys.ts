import type { JobFilterParams, JobListParams } from "./api/jobs";
import type { PublicJobListParams } from "./api/publicJobs";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (params: JobListParams) => ["jobs", "list", params] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  map: (params: JobFilterParams) => ["jobs", "map", params] as const,
};

/** Guest-facing queries live under their own root: never auth-invalidated. */
export const publicJobKeys = {
  all: ["public-jobs"] as const,
  list: (params: PublicJobListParams) =>
    ["public-jobs", "list", params] as const,
  detail: (id: string) => ["public-jobs", "detail", id] as const,
  stats: ["public-jobs", "stats"] as const,
};
