import { z } from "zod";

export const accountStatusSchema = z.enum(["active", "suspended"]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

const subscriptionStatusSchema = z.enum([
  "none",
  "incomplete",
  "active",
  "past_due",
  "canceled",
]);

export const recruiterListItemSchema = z.object({
  userId: z.string(),
  recruiterProfileId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  status: accountStatusSchema,
  subscriptionStatus: subscriptionStatusSchema,
  city: z.string().nullable(),
  state: z.string().nullable(),
  joinedAt: z.string(),
});
export type RecruiterListItem = z.infer<typeof recruiterListItemSchema>;

const recruiterReferenceSchema = z
  .object({ id: z.string(), name: z.string() })
  .passthrough();

export const recruiterDetailSchema = recruiterListItemSchema.extend({
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  zip: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  specializations: z.array(z.string()).nullable(),
  lastLoginAt: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  submissionCount: z.number(),
  references: z.array(recruiterReferenceSchema),
});
export type RecruiterDetail = z.infer<typeof recruiterDetailSchema>;

export const companyListItemSchema = z.object({
  userId: z.string(),
  companyProfileId: z.string(),
  companyName: z.string(),
  email: z.string(),
  status: accountStatusSchema,
  balanceMinor: z.number(),
  joinedAt: z.string(),
});
export type CompanyListItem = z.infer<typeof companyListItemSchema>;

export const companyDetailSchema = companyListItemSchema.extend({
  phone: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  reservedMinor: z.number(),
  availableMinor: z.number(),
  lastLoginAt: z.string().nullable(),
  jobCount: z.number(),
  openJobCount: z.number(),
});
export type CompanyDetail = z.infer<typeof companyDetailSchema>;

export const submissionStatusSchema = z.enum([
  "submitted",
  "under_review",
  "advanced",
  "rejected",
  "withdrawn",
]);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const conversationListItemSchema = z.object({
  submissionId: z.string(),
  companyProfileId: z.string(),
  companyName: z.string(),
  recruiterProfileId: z.string(),
  recruiterName: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  status: submissionStatusSchema,
  candidateCount: z.number(),
  lastActivityAt: z.string(),
});
export type ConversationListItem = z.infer<typeof conversationListItemSchema>;

export const conversationEventSchema = z.object({
  type: z.enum([
    "submission",
    "candidate",
    "proposal",
    "hire_response",
    "offer",
  ]),
  at: z.string(),
  actor: z.enum(["company", "recruiter", "system"]).nullable(),
  title: z.string(),
  body: z.string().nullable(),
});
export type ConversationEvent = z.infer<typeof conversationEventSchema>;

export const conversationThreadSchema = z.object({
  submissionId: z.string(),
  status: submissionStatusSchema,
  company: z.object({ profileId: z.string(), name: z.string() }),
  recruiter: z.object({ profileId: z.string(), name: z.string() }),
  job: z.object({ id: z.string(), title: z.string() }),
  events: z.array(conversationEventSchema),
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

export const SUBMISSION_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  advanced: "Advanced",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
