import axios from "axios";
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

export interface CandidateInput {
  fullName: string;
  email: string;
  phone?: string | null;
  overview?: string | null;
  linkedinUrl?: string | null;
  yearsOfExperience?: number | null;
  currentCompany?: string | null;
  expectedSalaryMinor?: number | null;
  noticePeriodDays?: number | null;
}

export interface StagedUpload {
  s3Key: string;
  uploadUrl: string;
}

/** POST /v1/submissions/:id/attachments/presign */
export async function presignSubmissionUpload(
  submissionId: string,
  file: File,
): Promise<StagedUpload> {
  const { data } = await apiClient.post<StagedUpload>(
    `/submissions/${submissionId}/attachments/presign`,
    { fileName: file.name, contentType: file.type },
  );
  return data;
}

/** Raw PUT to S3 — no auth header, so plain axios, not apiClient. */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
}

/** POST /v1/submissions/:submissionId/candidates */
export async function createCandidate(
  submissionId: string,
  input: CandidateInput,
  attachments: Array<{
    s3Key: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }>,
): Promise<Candidate> {
  const { data } = await apiClient.post<unknown>(
    `/submissions/${submissionId}/candidates`,
    { ...input, attachments },
  );
  return candidateSchema.parse(data);
}

/** PATCH /v1/candidates/:id */
export async function updateCandidate(
  id: string,
  input: Partial<CandidateInput>,
): Promise<Candidate> {
  const { data } = await apiClient.patch<unknown>(`/candidates/${id}`, input);
  return candidateSchema.parse(data);
}

/** DELETE /v1/candidates/:id */
export async function deleteCandidate(id: string): Promise<void> {
  await apiClient.delete(`/candidates/${id}`);
}
