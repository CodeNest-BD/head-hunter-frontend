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

export const submissionSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  recruiterProfileId: z.string(),
  status: submissionStatusSchema,
  note: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Submission = z.infer<typeof submissionSchema>;
