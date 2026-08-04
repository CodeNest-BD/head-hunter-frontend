import { apiClient } from "@/shared/libs/apiClient";
import {
  attachmentSchema,
  candidateSchema,
  type Attachment,
  type Candidate,
  type CandidateStatus,
} from "../schemas";

/** GET /v1/submissions/:submissionId/candidates — bounded at five, not paginated. */
export async function fetchCandidates(
  submissionId: string,
): Promise<Candidate[]> {
  const { data } = await apiClient.get<unknown>(
    `/submissions/${submissionId}/candidates`,
  );
  return candidateSchema.array().parse(data);
}

/** PATCH /v1/candidates/:id */
export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus,
): Promise<Candidate> {
  const { data } = await apiClient.patch<unknown>(`/candidates/${id}`, {
    status,
  });
  return candidateSchema.parse(data);
}

/** GET /v1/candidates/:candidateId/attachments — links expire in 15 minutes. */
export async function fetchAttachments(
  candidateId: string,
): Promise<Attachment[]> {
  const { data } = await apiClient.get<unknown>(
    `/candidates/${candidateId}/attachments`,
  );
  return attachmentSchema.array().parse(data);
}
