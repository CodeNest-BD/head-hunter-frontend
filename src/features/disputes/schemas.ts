import { z } from "zod";

export const disputeStatusSchema = z.enum([
  "open",
  "under_review",
  "resolved_release",
  "resolved_refund",
  "resolved_split",
]);
export type DisputeStatus = z.infer<typeof disputeStatusSchema>;

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved_release: "Resolved — Paid Recruiter",
  resolved_refund: "Resolved — Refunded Company",
  resolved_split: "Resolved — Split",
};

/** A resolved dispute is terminal — no more messages or actions. */
export const isDisputeOpen = (status: DisputeStatus): boolean =>
  status === "open" || status === "under_review";

export const disputeChannelSchema = z.enum(["company", "recruiter"]);
export type DisputeChannel = z.infer<typeof disputeChannelSchema>;

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
  placementId: z.string(),
  offerId: z.string(),
  jobTitle: z.string(),
  counterpartyName: z.string(),
  amountMinor: z.number(),
  status: disputeStatusSchema,
  raisedByMe: z.boolean(),
  reason: z.string(),
  resolutionNote: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
});
export type ParticipantDispute = z.infer<typeof participantDisputeSchema>;

export const participantDisputeDetailSchema = participantDisputeSchema.extend({
  messages: z.array(disputeMessageSchema),
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
  status: disputeStatusSchema,
  raisedBy: disputeChannelSchema,
  companyName: z.string(),
  recruiterName: z.string(),
  jobTitle: z.string(),
  candidateName: z.string(),
  candidateId: z.string(),
  offerId: z.string(),
  placementId: z.string(),
  placementStatus: z.string(),
  amountMinor: z.number(),
  reason: z.string(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
});
export type AdminDisputeListItem = z.infer<typeof adminDisputeListItemSchema>;

export const adminDisputeDetailSchema = adminDisputeListItemSchema.extend({
  joiningDate: z.string(),
  holdExpiresAt: z.string(),
  resolutionNote: z.string().nullable(),
  companyMessages: z.array(disputeMessageSchema),
  recruiterMessages: z.array(disputeMessageSchema),
  attachments: z.array(disputeAttachmentSchema).catch([]),
});
export type AdminDisputeDetail = z.infer<typeof adminDisputeDetailSchema>;

/** The Disputes nav badge's payload. */
export const disputeAttentionCountSchema = z.object({ count: z.number() });
