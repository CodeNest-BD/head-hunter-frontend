import { z } from "zod";

// Imported from the conversations feature's schemas module directly, not its
// barrel: the barrel also re-exports Thread and its hooks, which pull in
// features/conversations' API client — this file only needs the
// dependency-free event schema (schemas.ts imports nothing but zod and other
// dependency-free schema modules).
import {
  conversationEventSchema,
  conversationThreadHeaderSchema,
  type ConversationEvent,
} from "@/features/conversations/schemas";
import { paginatedSchema } from "@/shared/libs/pagination";
import { tolerantEnum } from "@/shared/libs/zodTolerantEnum";

export { conversationEventSchema };
export type { ConversationEvent };

export const accountStatusSchema = z.enum(["active", "suspended"]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

const subscriptionStatusSchema = z.enum([
  "none",
  "incomplete",
  "active",
  "past_due",
  "canceled",
]);

export const verificationStatusSchema = z.enum([
  "pending",
  "verified",
  "rejected",
]);
export type AdminVerificationStatus = z.infer<typeof verificationStatusSchema>;

export const recruiterListItemSchema = z.object({
  userId: z.string(),
  recruiterProfileId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  status: accountStatusSchema,
  subscriptionStatus: subscriptionStatusSchema,
  verificationStatus: verificationStatusSchema.catch("pending"),
  ratingAvg: z.number().nullable().catch(null),
  ratingCount: z.number().catch(0),
  city: z.string().nullable(),
  state: z.string().nullable(),
  joinedAt: z.string(),
});
export type RecruiterListItem = z.infer<typeof recruiterListItemSchema>;

const recruiterReferenceSchema = z
  .object({ id: z.string(), name: z.string() })
  .passthrough();

export const recruiterExperienceSchema = z.object({
  id: z.string(),
  firmName: z.string(),
  years: z.number().nullable().catch(null),
  specializations: z.array(z.string()).catch([]),
});
export type RecruiterExperience = z.infer<typeof recruiterExperienceSchema>;

export const recruiterDetailSchema = recruiterListItemSchema.extend({
  emailVerified: z.boolean().catch(false),
  experiences: z.array(recruiterExperienceSchema).catch([]),
  verifiedAt: z.string().nullable().catch(null),
  verificationNote: z.string().nullable().catch(null),
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  zip: z.string().nullable(),
  linkedinUrl: z.string().nullable().catch(null),
  yearsExperience: z.number().nullable(),
  specializations: z.array(z.string()).nullable(),
  lastLoginAt: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  candidateCount: z.number(),
  releasedEarningsMinor: z.number(),
  references: z.array(recruiterReferenceSchema),
});
export type RecruiterDetail = z.infer<typeof recruiterDetailSchema>;

export const companyListItemSchema = z.object({
  userId: z.string(),
  companyProfileId: z.string(),
  companyName: z.string(),
  hasLogo: z.boolean().catch(false),
  email: z.string(),
  status: accountStatusSchema,
  verificationStatus: verificationStatusSchema.catch("pending"),
  balanceMinor: z.number(),
  jobCount: z.number(),
  joinedAt: z.string(),
});
export type CompanyListItem = z.infer<typeof companyListItemSchema>;

export const companyDetailSchema = companyListItemSchema.extend({
  // `.catch` throughout: a field the API has not shipped yet degrades to a
  // dash on the review screen rather than failing the whole page — the
  // failure mode that took the recruiter detail down.
  emailVerified: z.boolean().catch(false),
  verifiedAt: z.string().nullable().catch(null),
  verificationNote: z.string().nullable().catch(null),
  // The contact person on the account, not a company profile column.
  firstName: z.string().catch(""),
  lastName: z.string().catch(""),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  addressLine: z.string().nullable().catch(null),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable().catch(null),
  industry: z.string().nullable().catch(null),
  yearFounded: z.number().nullable().catch(null),
  employeeSize: z.string().nullable().catch(null),
  revenue: z.string().nullable().catch(null),
  commissionRangeMinMinor: z.number().nullable().catch(null),
  commissionRangeMaxMinor: z.number().nullable().catch(null),
  reservedMinor: z.number(),
  availableMinor: z.number(),
  lastLoginAt: z.string().nullable(),
  jobCount: z.number(),
  openJobCount: z.number(),
});
export type CompanyDetail = z.infer<typeof companyDetailSchema>;

// Same forward tolerance as the conversations feature's own status fields — a
// status this map doesn't know about yet should degrade the admin view, not
// throw it away.
export const candidateStatusSchema = tolerantEnum(
  [
    "submitted",
    "reviewing",
    "interviewing",
    "offered",
    "hired",
    "passed",
    "unknown",
  ],
  "unknown",
);
export type AdminCandidateStatus = z.infer<typeof candidateStatusSchema>;

export const conversationListItemSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  companyProfileId: z.string(),
  companyName: z.string(),
  recruiterProfileId: z.string(),
  recruiterName: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  status: candidateStatusSchema,
  messageCount: z.number(),
  lastActivityAt: z.string(),
});
export type ConversationListItem = z.infer<typeof conversationListItemSchema>;

/**
 * Admin's view of a thread: the header and one page of events, both shared
 * with the participant thread schema (`conversationThreadHeaderSchema` and
 * `paginatedSchema(conversationEventSchema)`, imported rather than
 * redeclared) — admin now pages through the same `{ data, meta }` envelope
 * as the participant view instead of loading the whole history at once.
 * The backend's header includes `candidates` too, but no admin UI reads
 * them, so this schema does not declare the field; zod strips it silently.
 */
export const conversationThreadSchema = conversationThreadHeaderSchema.extend({
  events: paginatedSchema(conversationEventSchema),
});
export type ConversationThread = z.infer<typeof conversationThreadSchema>;

export const accountStatusResponseSchema = z.object({
  userId: z.string(),
  status: accountStatusSchema,
});

export const SUBSCRIPTION_LABELS: Record<string, string> = {
  none: "No subscription",
  incomplete: "Incomplete",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
};

export const VERIFICATION_LABELS: Record<AdminVerificationStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
};

export const CANDIDATE_LABELS: Record<AdminCandidateStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  passed: "Passed",
  unknown: "Unknown",
};

export const adminStatsSchema = z.object({
  recruiters: z.object({
    total: z.number(),
    active: z.number(),
    held: z.number(),
    subscribed: z.number(),
  }),
  companies: z.object({
    total: z.number(),
    active: z.number(),
    held: z.number(),
  }),
  conversations: z.number(),
  walletTotalMinor: z.number(),
  signups: z.array(
    z.object({
      month: z.string(),
      recruiters: z.number(),
      companies: z.number(),
    }),
  ),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

export const jobStatusSchema = tolerantEnum(
  ["draft", "published", "paused", "filled", "closed", "expired", "unknown"],
  "unknown",
);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const adminJobListItemSchema = z.object({
  jobId: z.string(),
  title: z.string(),
  companyProfileId: z.string(),
  companyUserId: z.string().catch(""),
  companyName: z.string(),
  hasLogo: z.boolean().catch(false),
  status: jobStatusSchema,
  recruiterFeeMinor: z.number(),
  locationState: z.string().nullable(),
  candidateCount: z.number(),
  createdAt: z.string(),
});
export type AdminJobListItem = z.infer<typeof adminJobListItemSchema>;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  filled: "Filled",
  closed: "Closed",
  expired: "Expired",
  unknown: "Unknown",
};

export const minRecruiterFeeSchema = z.object({
  amountMinor: z.number(),
  currency: z.string().catch("usd"),
});
export type MinRecruiterFee = z.infer<typeof minRecruiterFeeSchema>;

export const recruiterPricingSchema = z.object({
  amountMinor: z.number().nullable(),
  priceId: z.string().nullable(),
  currency: z.string(),
});
export type RecruiterPricing = z.infer<typeof recruiterPricingSchema>;

export const adminUserSchema = z.object({
  userId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;
