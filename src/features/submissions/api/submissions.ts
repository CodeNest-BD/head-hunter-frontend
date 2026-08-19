import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  inboxJobRowSchema,
  inboxRecruiterRowSchema,
  submissionSchema,
  type InboxJobRow,
  type InboxRecruiterRow,
  type Submission,
  type SubmissionStatus,
} from "../schemas";

export interface SubmissionListParams {
  page?: number;
  limit?: number;
  jobId?: string;
  status?: SubmissionStatus;
}

/** GET /v1/submissions — a company sees submissions on its own jobs. */
export async function fetchSubmissions(
  params: SubmissionListParams,
): Promise<Paginated<Submission>> {
  const { data } = await apiClient.get<unknown>("/submissions", { params });
  return paginatedSchema(submissionSchema).parse(data);
}

/** GET /v1/submissions/:id */
export async function fetchSubmission(id: string): Promise<Submission> {
  const { data } = await apiClient.get<unknown>(`/submissions/${id}`);
  return submissionSchema.parse(data);
}

/**
 * PATCH /v1/submissions/:id
 *
 * The API splits ownership by role: a company may set `status`, a recruiter may
 * set `note`, and sending the other side's field is rejected. This helper only
 * exposes status because the inbox is the company's view.
 */
export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<Submission> {
  const { data } = await apiClient.patch<unknown>(`/submissions/${id}`, {
    status,
  });
  return submissionSchema.parse(data);
}

/** POST /v1/submissions — 409 when one already exists for this job. */
export async function createSubmission(
  jobId: string,
  note?: string,
): Promise<Submission> {
  const { data } = await apiClient.post<unknown>(
    "/submissions",
    { jobId, ...(note ? { note } : {}) },
    { suppressGlobalErrorToast: true },
  );
  return submissionSchema.parse(data);
}

/** GET /v1/submissions/inbox/jobs — level 1 of the company inbox. */
export async function fetchInboxJobs(
  page: number,
  limit = 25,
): Promise<Paginated<InboxJobRow>> {
  const { data } = await apiClient.get<unknown>("/submissions/inbox/jobs", {
    params: { page, limit },
  });
  return paginatedSchema(inboxJobRowSchema).parse(data);
}

/** GET /v1/submissions/inbox/jobs/:jobId/recruiters — level 2, rating-sorted. */
export async function fetchInboxRecruiters(
  jobId: string,
  page: number,
  limit = 25,
): Promise<Paginated<InboxRecruiterRow>> {
  const { data } = await apiClient.get<unknown>(
    `/submissions/inbox/jobs/${jobId}/recruiters`,
    { params: { page, limit } },
  );
  return paginatedSchema(inboxRecruiterRowSchema).parse(data);
}
