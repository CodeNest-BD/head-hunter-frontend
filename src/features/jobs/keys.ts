import type { JobFilterParams, JobListParams } from "./api/jobs";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (params: JobListParams) => ["jobs", "list", params] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  map: (params: JobFilterParams) => ["jobs", "map", params] as const,
};
