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

/**
 * Complete on purpose: every status stays *displayable*, because rows already
 * carry every one of them. Dropping an entry here would leave those rows with a
 * blank badge.
 */
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  advanced: "Advanced",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** Filtering is displayable too: all five, so no existing row is unfindable. */
export const SUBMISSION_STATUS_FILTER_OPTIONS: readonly {
  value: SubmissionStatus;
  label: string;
}[] = SUBMISSION_STATUSES.map((value) => ({
  value,
  label: SUBMISSION_STATUS_LABELS[value],
}));

/**
 * Displayable is the whole enum; *settable* is this subset — the statuses the
 * platform actually reacts to. `submitted` is what the company inbox counts as
 * new, and `rejected`/`withdrawn` close the submission to messages, interviews
 * and further candidates. `under_review` and `advanced` gate nothing anywhere:
 * they exist for historical rows only, so a picker offering them would be
 * offering a choice with no effect. The API refuses them as well.
 */
export const SETTABLE_SUBMISSION_STATUSES = [
  "submitted",
  "rejected",
  "withdrawn",
] as const satisfies readonly SubmissionStatus[];
export type SettableSubmissionStatus =
  (typeof SETTABLE_SUBMISSION_STATUSES)[number];

/**
 * What a *company* may set: the settable statuses minus `withdrawn`, which is
 * the recruiter's own exit from a submission and is refused for anyone else.
 */
export const COMPANY_SETTABLE_STATUSES = [
  "submitted",
  "rejected",
] as const satisfies readonly SettableSubmissionStatus[];
export type CompanySettableStatus = (typeof COMPANY_SETTABLE_STATUSES)[number];

export const isCompanySettableStatus = (
  value: string,
): value is CompanySettableStatus =>
  COMPANY_SETTABLE_STATUSES.some((status) => status === value);

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
