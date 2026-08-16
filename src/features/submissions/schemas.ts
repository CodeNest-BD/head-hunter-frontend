import { z } from "zod";

export const SUBMISSION_STATUSES = [
  "submitted",
  "under_review",
  "advanced",
  "rejected",
  "withdrawn",
] as const;
export const submissionStatusSchema = z.enum(SUBMISSION_STATUSES);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  advanced: "Advanced",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/**
 * Statuses a company may move a submission to. `withdrawn` is the recruiter's
 * action, so it is deliberately absent.
 */
export const COMPANY_SETTABLE_STATUSES = [
  "submitted",
  "under_review",
  "advanced",
  "rejected",
] as const satisfies readonly SubmissionStatus[];

/**
 * What a company may see about the submitting recruiter. Contact details are
 * deliberately absent server-side — name and experience only.
 */
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
  recruiter: RecruiterSummary | null,
): string =>
  recruiter ? `${recruiter.firstName} ${recruiter.lastName}`.trim() : "—";

export const submissionSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  recruiterProfileId: z.string(),
  recruiter: recruiterSummarySchema.nullable(),
  status: submissionStatusSchema,
  note: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Submission = z.infer<typeof submissionSchema>;

export const JOB_STATUSES_IN_INBOX = [
  "draft",
  "published",
  "paused",
  "filled",
  "closed",
  "expired",
] as const;

/** Level 1 of the company inbox: one row per job that has submissions. */
export const inboxJobRowSchema = z.object({
  jobId: z.string(),
  jobTitle: z.string(),
  jobStatus: z.enum(JOB_STATUSES_IN_INBOX).catch("published"),
  submissionCount: z.number(),
  newSubmissionCount: z.number(),
  unreadMessages: z.number(),
  lastSubmittedAt: z.coerce.date(),
});
export type InboxJobRow = z.infer<typeof inboxJobRowSchema>;

/** Level 2: one recruiter submission on the selected job, best-rated first. */
export const inboxRecruiterRowSchema = z.object({
  submissionId: z.string(),
  status: submissionStatusSchema,
  submittedAt: z.coerce.date(),
  candidateCount: z.number(),
  unreadMessages: z.number(),
  recruiter: recruiterSummarySchema.nullable(),
});
export type InboxRecruiterRow = z.infer<typeof inboxRecruiterRowSchema>;
