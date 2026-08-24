import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  inboxAttentionCountSchema,
  inboxCandidateRowSchema,
  inboxJobRowSchema,
  type InboxCandidateRow,
  type InboxCandidateSort,
  type InboxJobRow,
} from "../schemas";

/** Which side is asking. The two inboxes are the same drill-down, mirrored. */
export type InboxSide = "company" | "recruiter";

export interface InboxJobsParams {
  page?: number;
  limit?: number;
  /** Case-insensitive match on the job title. */
  q?: string;
  /** Job status filter. */
  status?: string;
}

export interface InboxCandidatesParams {
  page?: number;
  limit?: number;
  /** Case-insensitive match on the candidate's or recruiter's name. */
  q?: string;
  /** Candidate status filter. */
  status?: string;
  sortBy?: InboxCandidateSort;
  sortOrder?: "ASC" | "DESC";
}

/** GET /v1/{side}/inbox/jobs — level 1 of either inbox. */
export async function fetchInboxJobs(
  side: InboxSide,
  params: InboxJobsParams,
): Promise<Paginated<InboxJobRow>> {
  const { data } = await apiClient.get<unknown>(`/${side}/inbox/jobs`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      q: params.q || undefined,
      status: params.status || undefined,
    },
  });
  return paginatedSchema(inboxJobRowSchema).parse(data);
}

/** GET /v1/{side}/inbox/jobs/:jobId/candidates — level 2, newest first. */
export async function fetchInboxCandidates(
  side: InboxSide,
  jobId: string,
  params: InboxCandidatesParams,
): Promise<Paginated<InboxCandidateRow>> {
  const { data } = await apiClient.get<unknown>(
    `/${side}/inbox/jobs/${jobId}/candidates`,
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 25,
        q: params.q || undefined,
        status: params.status || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
    },
  );
  return paginatedSchema(inboxCandidateRowSchema).parse(data);
}

/** GET /v1/{side}/inbox/attention-count — the number behind the nav badge. */
export async function fetchInboxAttentionCount(
  side: InboxSide,
): Promise<number> {
  const { data } = await apiClient.get<unknown>(
    `/${side}/inbox/attention-count`,
  );
  return inboxAttentionCountSchema.parse(data).count;
}
