import type { JobFilterParams, JobListParams } from "./api/jobs";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (params: JobListParams) => ["jobs", "list", params] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  map: (params: JobFilterParams) => ["jobs", "map", params] as const,
};

/** The one surviving public query (the landing stats strip) lives under its
 * own root: never auth-invalidated. */
export const publicJobKeys = {
  stats: ["public-jobs", "stats"] as const,
};
