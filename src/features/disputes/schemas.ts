import { z } from "zod";

import { recruiterPayoutAccountSchema } from "@/features/admin/schemas";
import { serialNumberSchema } from "@/shared/utils/entityPaths";

export const disputeStatusSchema = z.enum([
  "open",
  "under_review",
  "resolved_release",
  "resolved_refund",
  "resolved_split",
  "resolved_resumed",
  "closed",
]);
export type DisputeStatus = z.infer<typeof disputeStatusSchema>;

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved_release: "Resolved — Paid Recruiter",
  resolved_refund: "Resolved — Refunded Company",
  resolved_split: "Resolved — Split",
  resolved_resumed: "Resolved — Countdown Resumed",
  closed: "Closed",
};

/**
 * How an admin settles a dispute. The two money moves are final and one-way;
 * the other two leave the fee where it is.
 */
export type DisputeResolution = "release" | "refund" | "resume" | "close";

/** The two outcomes that actually move money, and cannot be undone. */
export const FINAL_RESOLUTIONS: readonly DisputeResolution[] = [
  "release",
  "refund",
];

/**
 * The outcomes that end the case, so the note is both parties' record of why.
 * Mirrors the backend's `NOTE_REQUIRED_RESOLUTIONS`; "resume" keeps it running.
 */
export const NOTE_REQUIRED_RESOLUTIONS: readonly DisputeResolution[] = [
  ...FINAL_RESOLUTIONS,
  "close",
];

/** Mirrors the backend `DisputeCountdownDto`. */
export const disputeCountdownSchema = z.object({
  state: z.enum([
    "not_started",
    "paused",
    "ended_before_dispute",
    "resumed",
    "stopped",
    "settled",
  ]),
  pausedMs: z.number(),
  remainingMs: z.number().nullable(),
  joiningDate: z.string(),
  releaseAt: z.string(),
});
export type DisputeCountdown = z.infer<typeof disputeCountdownSchema>;

/** A resolved dispute is terminal — no more messages or actions. */
export const isDisputeOpen = (status: DisputeStatus): boolean =>
  status === "open" || status === "under_review";

export const disputeChannelSchema = z.enum(["company", "recruiter"]);
export type DisputeChannel = z.infer<typeof disputeChannelSchema>;

/** Mirrors the backend `DisputeSubject` enum and its per-side lists. */
export const disputeSubjectSchema = z.enum([
  "candidate_did_not_join",
  "candidate_left_during_guarantee",
  "candidate_misrepresented",
  "candidate_not_as_presented",
  "duplicate_candidate",
  "recruiter_misconduct",
  "placement_wrongly_rejected",
  "hired_outside_platform",
  "fee_not_released",
  "offer_terms_changed",
  "company_unresponsive",
  "company_misconduct",
  "fee_amount_incorrect",
  "other",
]);
export type DisputeSubject = z.infer<typeof disputeSubjectSchema>;

export const DISPUTE_SUBJECT_LABELS: Record<DisputeSubject, string> = {
  candidate_did_not_join: "Candidate Did Not Join",
  candidate_left_during_guarantee: "Candidate Left Early",
  candidate_misrepresented: "Candidate Misrepresented",
  candidate_not_as_presented: "Candidate Not As Presented",
  duplicate_candidate: "Duplicate Candidate",
  recruiter_misconduct: "Recruiter Misconduct",
  placement_wrongly_rejected: "Placement Wrongly Rejected",
  hired_outside_platform: "Hired Outside The Platform",
  fee_not_released: "Fee Not Released",
  offer_terms_changed: "Offer Terms Changed",
  company_unresponsive: "Company Unresponsive",
  company_misconduct: "Company Misconduct",
  fee_amount_incorrect: "Fee Amount Incorrect",
  other: "Other",
};

export const DISPUTE_SUBJECTS_BY_PARTY: Record<
  DisputeChannel,
  readonly DisputeSubject[]
> = {
  company: [
    "candidate_did_not_join",
    "candidate_left_during_guarantee",
    "candidate_misrepresented",
    "candidate_not_as_presented",
    "duplicate_candidate",
    "fee_amount_incorrect",
    "recruiter_misconduct",
    "other",
  ],
  recruiter: [
    "placement_wrongly_rejected",
    "hired_outside_platform",
    "fee_not_released",
    "fee_amount_incorrect",
    "offer_terms_changed",
    "company_unresponsive",
    "company_misconduct",
    "other",
  ],
};

export const disputeMessageSchema = z.object({
  id: z.string(),
  channel: disputeChannelSchema,
  senderRole: z.enum(["admin", "company", "recruiter"]),
  body: z.string(),
  createdAt: z.string(),
});
export type DisputeMessage = z.infer<typeof disputeMessageSchema>;

/** A piece of proof filed with a dispute. Links are short-lived, signed, and
 * re-minted on every read of the dispute. */
export const disputeAttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  contentType: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  uploadedBy: disputeChannelSchema,
  previewUrl: z.string(),
  downloadUrl: z.string(),
  createdAt: z.string(),
});
export type DisputeAttachment = z.infer<typeof disputeAttachmentSchema>;

/** A dispute as a participant (company or recruiter) sees it. */
export const participantDisputeSchema = z.object({
  id: z.string(),
  serialNumber: serialNumberSchema.optional(),
  placementId: z.string(),
  offerId: z.string(),
  jobTitle: z.string(),
  counterpartyName: z.string(),
  amountMinor: z.number(),
  status: disputeStatusSchema,
  raisedByMe: z.boolean(),
  subject: disputeSubjectSchema,
  reason: z.string(),
  resolutionNote: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  hasUpdate: z.boolean(),
});
export type ParticipantDispute = z.infer<typeof participantDisputeSchema>;

export const participantDisputeDetailSchema = participantDisputeSchema.extend({
  messages: z.array(disputeMessageSchema),
  countdown: disputeCountdownSchema,
  // Tolerant like `companyCanCoverFee`: a backend that predates proof must not
  // turn a dispute detail — or the response to raising one — into an error.
  attachments: z.array(disputeAttachmentSchema).catch([]),
});
export type ParticipantDisputeDetail = z.infer<
  typeof participantDisputeDetailSchema
>;

/** A dispute row in the admin inbox. */
export const adminDisputeListItemSchema = z.object({
  id: z.string(),
  serialNumber: serialNumberSchema.optional(),
  status: disputeStatusSchema,
  raisedBy: disputeChannelSchema,
  companyName: z.string(),
  recruiterName: z.string(),
  jobTitle: z.string(),
  candidateName: z.string(),
  candidateId: z.string(),
  candidateSerialNumber: serialNumberSchema.optional(),
  offerId: z.string(),
  placementId: z.string(),
  placementStatus: z.string(),
  amountMinor: z.number(),
  subject: disputeSubjectSchema,
  reason: z.string(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  unread: z.boolean(),
  // Added with the redesigned Dispute Center; `.catch` so the board still
  // renders against an API that predates them.
  holdExpiresAt: z.string().catch(""),
  joiningDate: z.string().catch(""),
  lastActivityAt: z.string().catch(""),
});
export type AdminDisputeListItem = z.infer<typeof adminDisputeListItemSchema>;

export const adminDisputeDetailSchema = adminDisputeListItemSchema.extend({
  joiningDate: z.string(),
  holdExpiresAt: z.string(),
  resolutionNote: z.string().nullable(),
  countdown: disputeCountdownSchema,
  companyMessages: z.array(disputeMessageSchema),
  recruiterMessages: z.array(disputeMessageSchema),
  attachments: z.array(disputeAttachmentSchema).catch([]),
  jobId: z.string(),
  jobSerialNumber: serialNumberSchema.optional(),
  /** User ids, not profile ids: the admin company/recruiter routes key on them. */
  companyUserId: z.string(),
  companySerialNumber: serialNumberSchema.optional(),
  recruiterUserId: z.string(),
  recruiterSerialNumber: serialNumberSchema.optional(),
  recruiterRatingAvg: z.number().nullable().catch(null),
  recruiterRatingCount: z.number().catch(0),
  payoutAccount: recruiterPayoutAccountSchema.nullable().catch(null),
});
export type AdminDisputeDetail = z.infer<typeof adminDisputeDetailSchema>;

/** The Disputes nav badge's payload. */
export const disputeAttentionCountSchema = z.object({ count: z.number() });

/** What the Dispute Center's summary band counts. */
export const adminDisputeSummarySchema = z.object({
  openCases: z.number().catch(0),
  companies: z.number().catch(0),
  needsAttention: z.number().catch(0),
  payoutDueSoon: z.number().catch(0),
  heldMinor: z.number().catch(0),
});
export type AdminDisputeSummary = z.infer<typeof adminDisputeSummarySchema>;
