import { z } from "zod";

import { candidateStatusSchema } from "@/features/candidates/schemas";

/** The submitting recruiter, as the company's inbox rows carry them. */
export const recruiterSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  yearsExperience: z.number().nullable(),
  specializations: z.array(z.string()).nullable(),
  // Tolerant: a backend that predates reviews reads as unrated.
  ratingAvg: z.number().nullable().catch(null),
  ratingCount: z.number().catch(0),
});
export type RecruiterSummary = z.infer<typeof recruiterSummarySchema>;

export const recruiterDisplayName = (
  recruiter: RecruiterSummary | null | undefined,
): string =>
  recruiter ? `${recruiter.firstName} ${recruiter.lastName}`.trim() : "—";

export const JOB_STATUSES_IN_INBOX = [
  "draft",
  "published",
  "paused",
  "filled",
  "closed",
  "expired",
] as const;

/** Level 1: one row per job that has candidates on it. */
export const inboxJobRowSchema = z.object({
  jobId: z.string(),
  jobTitle: z.string(),
  jobStatus: z.enum(JOB_STATUSES_IN_INBOX).catch("published"),
  candidateCount: z.number(),
  newCandidateCount: z.number(),
  unreadMessages: z.number(),
  lastCandidateAt: z.coerce.date(),
});
export type InboxJobRow = z.infer<typeof inboxJobRowSchema>;

/**
 * Level 2: one row per candidate on the selected job — one thread, one row.
 *
 * The counterparty rides on the row rather than being a level of its own: the
 * company sees which recruiter sent each candidate (`recruiter`), and the
 * recruiter sees which company they sent them to (`companyName`). Exactly one
 * of the two is present, decided by which inbox asked.
 */
export const inboxCandidateRowSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  status: candidateStatusSchema,
  submittedAt: z.coerce.date(),
  unreadMessages: z.number(),
  recruiter: recruiterSummarySchema.nullable().optional(),
  companyName: z.string().nullable().optional(),
});
export type InboxCandidateRow = z.infer<typeof inboxCandidateRowSchema>;

/** What a candidate list can be ordered by; direction is the shared sortOrder. */
export const INBOX_CANDIDATE_SORTS = [
  "submittedAt",
  "recruiterRating",
  "candidateName",
  "status",
] as const;
export type InboxCandidateSort = (typeof INBOX_CANDIDATE_SORTS)[number];
