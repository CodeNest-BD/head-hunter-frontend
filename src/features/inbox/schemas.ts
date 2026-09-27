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
  needsReview: z.boolean(),
  recruiter: recruiterSummarySchema.nullable().optional(),
  companyName: z.string().nullable().optional(),
});
export type InboxCandidateRow = z.infer<typeof inboxCandidateRowSchema>;

/**
 * The flat conversation inbox: one row per thread, most-recent first. Carries
 * everything the list renders — who it's with, what it's about, the last
 * message preview, and unread state — so opening it needs no extra fetch.
 */
export const inboxConversationRowSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  status: candidateStatusSchema,
  jobId: z.string(),
  jobTitle: z.string(),
  counterpartyName: z.string(),
  recruiter: recruiterSummarySchema.nullable().optional(),
  unreadMessages: z.number(),
  // Something happened on this thread the reader has not seen — a status
  // change, a message, an offer, an interview update. Tolerated as absent so a
  // backend that predates it still parses.
  needsReview: z.boolean().catch(false),
  lastMessagePreview: z.string().nullable(),
  lastMessageSender: z.enum(["company", "recruiter"]).nullable().optional(),
  lastActivityAt: z.coerce.date(),
  // When the candidate was first submitted. Optional so a backend that only
  // carries `lastActivityAt` still parses; the submissions table falls back to
  // last activity when it's absent.
  submittedAt: z.coerce.date().nullish(),
  // The job's advertised recruiter fee, for the submissions table's fee column
  // and its highest/lowest-fee sort. Optional; the column shows "—" without it.
  recruiterFeeMinor: z.number().nullish(),
});
export type InboxConversationRow = z.infer<typeof inboxConversationRowSchema>;

/** What a candidate list can be ordered by; direction is the shared sortOrder. */
export const INBOX_CANDIDATE_SORTS = [
  "submittedAt",
  "recruiterRating",
  "candidateName",
  "status",
] as const;
export type InboxCandidateSort = (typeof INBOX_CANDIDATE_SORTS)[number];

/** The sidebar badge's payload: candidates waiting on the caller. */
export const inboxAttentionCountSchema = z.object({
  count: z.number(),
});

/**
 * Whether a candidate row is one of the ones the nav badge is counting —
 * unread messages, or unseen activity (a new submission, offer, interview or
 * status change). Written once here because the sidebar count comes from the
 * server and the row highlight from the client: if the two rules drifted, the
 * badge would say 1 and no row would explain it.
 */
export const candidateNeedsAttention = (
  row: Pick<InboxCandidateRow, "unreadMessages" | "needsReview">,
): boolean => row.unreadMessages > 0 || row.needsReview;

/** One row of the company submissions queue. */
export const inboxSubmissionRowSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  status: candidateStatusSchema,
  jobId: z.string(),
  jobTitle: z.string(),
  submittedAt: z.coerce.date(),
  unreadMessages: z.number(),
  needsReview: z.boolean().catch(false),
  recruiter: recruiterSummarySchema.nullable(),
});
export type InboxSubmissionRow = z.infer<typeof inboxSubmissionRowSchema>;

/** The queue's stat cards — one count per status the product actually uses. */
export const inboxSubmissionStatsSchema = z.object({
  total: z.number(),
  submitted: z.number(),
  reviewing: z.number(),
  interviewing: z.number(),
  offered: z.number(),
  hired: z.number(),
  passed: z.number(),
});
export type InboxSubmissionStats = z.infer<typeof inboxSubmissionStatsSchema>;

/**
 * Sort modes for the queue. Priority — the default — is the requirements-doc
 * rule: recruiter rating first, newest submission breaking ties, unrated
 * recruiters after every rated one.
 */
export const SUBMISSION_SORTS = [
  "priority",
  "newest",
  "oldest",
  "ratingHigh",
  "ratingLow",
] as const;
export type SubmissionSort = (typeof SUBMISSION_SORTS)[number];

export const SUBMISSION_SORT_LABELS: Record<SubmissionSort, string> = {
  priority: "Priority (Rating ↓)",
  newest: "Newest Submission",
  oldest: "Oldest Submission",
  ratingHigh: "Rating: High to Low",
  ratingLow: "Rating: Low to High",
};

/** Rated vs not-yet-rated recruiters — keeps new recruiters findable. */
export const SUBMISSION_RECRUITER_KINDS = ["rated", "unrated"] as const;
export type SubmissionRecruiterKind =
  (typeof SUBMISSION_RECRUITER_KINDS)[number];
