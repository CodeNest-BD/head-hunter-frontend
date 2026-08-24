import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  jobMapEntrySchema,
  jobSchema,
  type Job,
  type JobMapEntry,
  type JobStatus,
} from "../schemas";

/** Filters shared by the list and the map so both stay in step. */
export interface JobFilterParams {
  roleCategory?: string;
  locationState?: string;
  isRemote?: boolean;
  feeMin?: number;
  feeMax?: number;
  q?: string;
}

export interface JobListParams extends JobFilterParams {
  page?: number;
  limit?: number;
  status?: JobStatus;
  /** Marketplace browsing only (explore-jobs, the recruiter dashboard); a
   * company's own job list doesn't sort. */
  sortBy?: "publishedAt" | "recruiterFeeMinor";
}

/** null clears a field; an omitted key leaves it unchanged. */
export interface JobWriteInput {
  title: string;
  description?: string | null;
  roleCategory: string;
  employmentType?: string | null;
  locationState?: string | null;
  locationCity?: string | null;
  isRemote: boolean;
  salaryMinMinor?: number | null;
  salaryMaxMinor?: number | null;
  recruiterFeeMinor: number;
}

/** GET /v1/jobs */
export async function fetchJobs(
  params: JobListParams,
): Promise<Paginated<Job>> {
  const { data } = await apiClient.get<unknown>("/jobs", { params });
  return paginatedSchema(jobSchema).parse(data);
}

/** GET /v1/jobs/:id */
export async function fetchJob(id: string): Promise<Job> {
  const { data } = await apiClient.get<unknown>(`/jobs/${id}`);
  return jobSchema.parse(data);
}

/** POST /v1/jobs — always created as a draft; status is not accepted here. */
export async function createJob(
  input: JobWriteInput,
  options?: { suppressGlobalErrorToast?: boolean },
): Promise<Job> {
  const { data } = await apiClient.post<unknown>("/jobs", input, options);
  return jobSchema.parse(data);
}

/** PATCH /v1/jobs/:id. `suppressGlobalErrorToast` lets a caller own its own
 * error UI (used by the create-then-publish flow). */
export async function updateJob(
  id: string,
  input: Partial<JobWriteInput> & { status?: JobStatus },
  options?: { suppressGlobalErrorToast?: boolean },
): Promise<Job> {
  const { data } = await apiClient.patch<unknown>(
    `/jobs/${id}`,
    input,
    options,
  );
  return jobSchema.parse(data);
}

/** DELETE /v1/jobs/:id — soft-deletes a job the caller owns (204). */
export async function deleteJob(id: string): Promise<void> {
  await apiClient.delete(`/jobs/${id}`);
}

/** GET /v1/jobs/map — not paginated; at most one row per US state. */
export async function fetchJobMap(
  params: JobFilterParams,
): Promise<JobMapEntry[]> {
  const { data } = await apiClient.get<unknown>("/jobs/map", { params });
  return jobMapEntrySchema.array().parse(data);
}
