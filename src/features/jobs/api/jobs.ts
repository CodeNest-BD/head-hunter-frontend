import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import { jobSchema, type Job, type JobStatus } from "../schemas";

export interface JobListParams {
  page?: number;
  limit?: number;
  status?: JobStatus;
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
export async function createJob(input: JobWriteInput): Promise<Job> {
  const { data } = await apiClient.post<unknown>("/jobs", input);
  return jobSchema.parse(data);
}

/** PATCH /v1/jobs/:id */
export async function updateJob(
  id: string,
  input: Partial<JobWriteInput> & { status?: JobStatus },
): Promise<Job> {
  const { data } = await apiClient.patch<unknown>(`/jobs/${id}`, input);
  return jobSchema.parse(data);
}
