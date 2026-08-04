import { z } from "zod";

export const CANDIDATE_STATUSES = [
  "submitted",
  "reviewing",
  "interviewing",
  "offered",
  "hired",
  "passed",
] as const;
export const candidateStatusSchema = z.enum(CANDIDATE_STATUSES);
export type CandidateStatus = z.infer<typeof candidateStatusSchema>;

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  passed: "Passed",
};

export const candidateSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  overview: z.string().nullable(),
  status: candidateStatusSchema,
  createdAt: z.coerce.date(),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const attachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  contentType: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  downloadUrl: z.string(),
  createdAt: z.coerce.date(),
});
export type Attachment = z.infer<typeof attachmentSchema>;
