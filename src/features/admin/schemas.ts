import { placementStatusSchema } from "@/features/billing/schemas";
import { jobSchema } from "@/features/jobs/schemas";
import { z } from "zod";

import { serialNumberSchema } from "@/shared/utils/entityPaths";
import { titleCase } from "@/shared/utils/titleCase";

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
  recruiterSerialNumber: serialNumberSchema.optional(),
  firstName: z.string().transform(titleCase),
  lastName: z.string().transform(titleCase),
  email: z.string(),
  status: accountStatusSchema,
  subscriptionStatus: subscriptionStatusSchema,
  verificationStatus: verificationStatusSchema.catch("pending"),
  ratingAvg: z.number().nullable().catch(null),
  ratingCount: z.number().catch(0),
  city: z.string().nullable(),
  state: z.string().nullable(),
  joinedAt: z.string(),
  // Successful placements (through the 30-day guarantee) and total commission
  // earned. `.catch` so the row still renders if the API predates them.
  placementCount: z.number().catch(0),
  commissionMinor: z.number().catch(0),
});
export type RecruiterListItem = z.infer<typeof recruiterListItemSchema>;

const recruiterReferenceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    // The company the reference is from (matches one of the recruiting-history
    // firms) and whether the reference has been verified.
    company: z.string().nullable().catch(null),
    verified: z.boolean().catch(false),
  })
  .passthrough();

export const recruiterExperienceSchema = z.object({
  id: z.string(),
  firmName: z.string(),
  years: z.number().nullable().catch(null),
  specializations: z.array(z.string()).catch([]),
});
export type RecruiterExperience = z.infer<typeof recruiterExperienceSchema>;

/** The placement funnel the profile leads with. */
export const recruiterLifecycleSchema = z.object({
  offersAccepted: z.number().catch(0),
  joined: z.number().catch(0),
  inGuarantee: z.number().catch(0),
  disputed: z.number().catch(0),
  completed: z.number().catch(0),
  paid: z.number().catch(0),
});
export type RecruiterLifecycle = z.infer<typeof recruiterLifecycleSchema>;

export const recruiterPayoutAccountSchema = z.object({
  status: z.string(),
  bankName: z.string().nullable().catch(null),
  bankLast4: z.string().nullable().catch(null),
  disabledReason: z.string().nullable().catch(null),
});
export type RecruiterPayoutAccount = z.infer<
  typeof recruiterPayoutAccountSchema
>;

export const recruiterOpenDisputeSchema = z.object({
  id: z.string(),
  serialNumber: z.number(),
  status: z.string(),
  subject: z.string(),
  companyName: z.string().catch(""),
  amountMinor: z.number().catch(0),
});
export type RecruiterOpenDispute = z.infer<typeof recruiterOpenDisputeSchema>;

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
  placementCount: z.number().catch(0),
  releasedEarningsMinor: z.number(),
  phoneVerified: z.boolean().catch(false),
  references: z.array(recruiterReferenceSchema),
  // Added with the redesigned profile; `.catch` so the page still renders
  // against an API that predates them.
  lifecycle: recruiterLifecycleSchema.catch({
    offersAccepted: 0,
    joined: 0,
    inGuarantee: 0,
    disputed: 0,
    completed: 0,
    paid: 0,
  }),
  payoutAccount: recruiterPayoutAccountSchema.nullable().catch(null),
  openDisputes: z.array(recruiterOpenDisputeSchema).catch([]),
});
export type RecruiterDetail = z.infer<typeof recruiterDetailSchema>;

export const companyListItemSchema = z.object({
  userId: z.string(),
  companyProfileId: z.string(),
  companySerialNumber: serialNumberSchema.optional(),
  companyName: z.string(),
  hasLogo: z.boolean().catch(false),
  email: z.string(),
  status: accountStatusSchema,
  verificationStatus: verificationStatusSchema.catch("pending"),
  balanceMinor: z.number(),
  jobCount: z.number(),
  joinedAt: z.string(),
  // Free text from the sign-up questionnaire; printed beside the email.
  industry: z.string().nullable().catch(null),
  // Average recruiter fee across this company's posted jobs, null when none.
  avgFeeMinor: z.number().nullable().catch(null),
});
export type CompanyListItem = z.infer<typeof companyListItemSchema>;

/** One line of the company's wallet history, for the profile's preview. */
export const companyLedgerRowSchema = z.object({
  id: z.string(),
  at: z.string(),
  entryType: z.string(),
  referenceType: z.string(),
  amountMinor: z.number().catch(0),
  balanceAfterMinor: z.number().catch(0),
});
export type CompanyLedgerRow = z.infer<typeof companyLedgerRowSchema>;

export const companyDetailSchema = companyListItemSchema.extend({
  // `.catch` throughout: a field the API has not shipped yet degrades to a
  // dash on the review screen rather than failing the whole page — the
  // failure mode that took the recruiter detail down.
  emailVerified: z.boolean().catch(false),
  phoneVerified: z.boolean().catch(false),
  verifiedAt: z.string().nullable().catch(null),
  verificationNote: z.string().nullable().catch(null),
  // The contact person on the account, not a company profile column.
  firstName: z.string().catch("").transform(titleCase),
  lastName: z.string().catch("").transform(titleCase),
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
  // Smallest and largest recruiter fee the company has actually posted — the
  // advertised commission range above is self-reported and drifts from it.
  minFeeMinor: z.number().nullable().catch(null),
  maxFeeMinor: z.number().nullable().catch(null),
  reservedMinor: z.number(),
  availableMinor: z.number(),
  lastLoginAt: z.string().nullable(),
  jobCount: z.number(),
  openJobCount: z.number(),
  // Added with the redesigned profile; `.catch` so the page still renders
  // against an API that predates them.
  placementCount: z.number().catch(0),
  offerCount: z.number().catch(0),
  recentLedger: z.array(companyLedgerRowSchema).catch([]),
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
  candidateSerialNumber: serialNumberSchema.optional(),
  candidateName: z.string().transform(titleCase),
  companyProfileId: z.string(),
  companyName: z.string(),
  recruiterProfileId: z.string(),
  recruiterName: z.string().transform(titleCase),
  jobId: z.string(),
  jobSerialNumber: serialNumberSchema.optional(),
  jobTitle: z.string(),
  status: candidateStatusSchema,
  messageCount: z.number(),
  lastActivityAt: z.string(),
  // Distinct from lastActivityAt: when the recruiter sent the candidate.
  submittedAt: z.string().catch(""),
  recruiterRatingAvg: z.number().nullable().catch(null),
  recruiterRatingCount: z.number().catch(0),
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
    verified: z.number().catch(0),
    pending: z.number().catch(0),
  }),
  companies: z.object({
    total: z.number(),
    active: z.number(),
    held: z.number(),
    // Approved (verified) companies. `.catch` so an older API degrades to 0.
    approved: z.number().catch(0),
    pending: z.number().catch(0),
  }),
  conversations: z.number(),
  walletTotalMinor: z.number(),
  // The dashboard prints the wallet total with its split beneath it, so all
  // three have to come from the same read.
  walletAvailableMinor: z.number().catch(0),
  walletReservedMinor: z.number().catch(0),
  liveJobs: z.number().catch(0),
  feeMinMinor: z.number().catch(0),
  feeMaxMinor: z.number().catch(0),
  // Average recruiter fee across all live jobs, and job counts by lifecycle
  // stage for the Jobs banner. `.catch` for forward-tolerance.
  avgFeeMinor: z.number().catch(0),
  scheduledJobs: z.number().catch(0),
  offerJobs: z.number().catch(0),
  signups: z.array(
    z.object({
      month: z.string(),
      recruiters: z.number(),
      companies: z.number(),
    }),
  ),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

/**
 * The admin dashboard's "Needs your attention" queues, money position and
 * activity feed.
 *
 * The server sends a stable key and the facts behind each count; the labels,
 * icons and tones are the client's, so wording changes do not need a deploy on
 * both sides.
 */
export const DASHBOARD_QUEUE_KEYS = [
  "disputes_near_payout",
  "disputes_awaiting_reply",
  "failed_payouts",
  "payments_on_hold",
  "recruiter_verifications",
  "company_approvals",
] as const;
export type DashboardQueueKey = (typeof DASHBOARD_QUEUE_KEYS)[number];

const moneyBucketSchema = z.object({
  amountMinor: z.number().catch(0),
  count: z.number().catch(0),
});

export const adminDashboardSchema = z.object({
  queues: z
    .array(
      z.object({
        key: z.enum(DASHBOARD_QUEUE_KEYS),
        count: z.number().catch(0),
        priority: z
          .enum(["urgent", "failed", "on_hold", "to_review"])
          .catch("to_review"),
        urgent: z.boolean().catch(false),
        context: z.string().catch(""),
      }),
    )
    .catch([]),
  money: z
    .object({
      onHold: moneyBucketSchema.extend({
        disputeHolds: z.number().catch(0),
        manualHolds: z.number().catch(0),
      }),
      dueSoon: moneyBucketSchema,
      paidRecently: moneyBucketSchema,
      refundedRecently: moneyBucketSchema,
      failedPayouts: moneyBucketSchema,
    })
    .catch({
      onHold: { amountMinor: 0, count: 0, disputeHolds: 0, manualHolds: 0 },
      dueSoon: { amountMinor: 0, count: 0 },
      paidRecently: { amountMinor: 0, count: 0 },
      refundedRecently: { amountMinor: 0, count: 0 },
      failedPayouts: { amountMinor: 0, count: 0 },
    }),
  activity: z
    .array(
      z.object({
        kind: z
          .enum(["dispute", "money", "account", "hiring"])
          .catch("account"),
        title: z.string(),
        detail: z.string().catch(""),
        actor: z.string().catch(""),
        at: z.string(),
      }),
    )
    .catch([]),
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;
export type DashboardQueue = AdminDashboard["queues"][number];
export type DashboardEvent = AdminDashboard["activity"][number];

/**
 * A job as an admin reviews it: the company's own view of the job plus the
 * submissions against it. Extends the shared `jobSchema` so the two can never
 * disagree about what a job is.
 */
export const adminJobPipelineSchema = z.object({
  submitted: z.number().catch(0),
  reviewing: z.number().catch(0),
  interviewing: z.number().catch(0),
  offered: z.number().catch(0),
  hired: z.number().catch(0),
  passed: z.number().catch(0),
  recruiterCount: z.number().catch(0),
});
export type AdminJobPipeline = z.infer<typeof adminJobPipelineSchema>;

export const adminJobCandidateSchema = z.object({
  candidateId: z.string(),
  candidateSerialNumber: serialNumberSchema.optional(),
  candidateName: z.string().transform(titleCase),
  recruiterProfileId: z.string(),
  recruiterName: z.string().transform(titleCase),
  recruiterRatingAvg: z.number().nullable().catch(null),
  status: candidateStatusSchema,
  submittedAt: z.string(),
  lastActivityAt: z.string(),
});
export type AdminJobCandidate = z.infer<typeof adminJobCandidateSchema>;

export const adminJobComingUpSchema = z.object({
  id: z.string(),
  kind: z.enum(["interview", "offer"]).catch("interview"),
  candidateName: z.string().transform(titleCase),
  at: z.string().nullable().catch(null),
  state: z.string(),
  amountMinor: z.number().nullable().catch(null),
});
export type AdminJobComingUp = z.infer<typeof adminJobComingUpSchema>;

export const adminJobDetailSchema = jobSchema.extend({
  company: z.object({
    companyProfileId: z.string(),
    companyUserId: z.string().catch(""),
    companySerialNumber: serialNumberSchema.optional(),
    companyName: z.string(),
    contactName: z.string().catch(""),
    verificationStatus: verificationStatusSchema.catch("pending"),
    walletBalanceMinor: z.number().catch(0),
  }),
  pipeline: adminJobPipelineSchema,
  candidates: z.array(adminJobCandidateSchema).catch([]),
  comingUp: z.array(adminJobComingUpSchema).catch([]),
  conversationCount: z.number().catch(0),
  reservedMinor: z.number().catch(0),
});
export type AdminJobDetail = z.infer<typeof adminJobDetailSchema>;

/** The slices of the placements board, in the order the design lists them. */
export const PLACEMENT_VIEWS = [
  "all",
  "not_joined",
  "in_guarantee",
  "guarantee_complete",
  "payment_blocked",
  "paid",
  "disputed",
] as const;
export type PlacementView = (typeof PLACEMENT_VIEWS)[number];

export const placementCountsSchema = z.object({
  all: z.number().catch(0),
  notJoined: z.number().catch(0),
  inGuarantee: z.number().catch(0),
  guaranteeComplete: z.number().catch(0),
  paymentBlocked: z.number().catch(0),
  paid: z.number().catch(0),
  disputed: z.number().catch(0),
});
export type PlacementCounts = z.infer<typeof placementCountsSchema>;

export const adminPlacementSchema = z.object({
  id: z.string(),
  offerId: z.string(),
  candidateId: z.string(),
  candidateSerialNumber: serialNumberSchema.optional(),
  candidateName: z.string().transform(titleCase),
  jobTitle: z.string(),
  companyProfileId: z.string(),
  companySerialNumber: serialNumberSchema.optional(),
  companyUserId: z.string().catch(""),
  companyName: z.string(),
  recruiterProfileId: z.string(),
  recruiterSerialNumber: serialNumberSchema.optional(),
  recruiterUserId: z.string().catch(""),
  recruiterName: z.string().transform(titleCase),
  amountMinor: z.number().catch(0),
  status: placementStatusSchema,
  joiningDate: z.string(),
  holdExpiresAt: z.string(),
  releasedAt: z.string().nullable().catch(null),
  openDisputeId: z.string().nullable().catch(null),
  openDisputeSerialNumber: z.number().nullable().catch(null),
  disputeOpenedAt: z.string().nullable().catch(null),
});
export type AdminPlacement = z.infer<typeof adminPlacementSchema>;

export const adminOfferSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  candidateSerialNumber: serialNumberSchema.optional(),
  candidateName: z.string().transform(titleCase),
  jobTitle: z.string(),
  companyName: z.string(),
  recruiterName: z.string().transform(titleCase),
  amountMinor: z.number().catch(0),
  status: z.string(),
  createdAt: z.string(),
  hasPlacement: z.boolean().catch(false),
});
export type AdminOffer = z.infer<typeof adminOfferSchema>;

export const jobStatusSchema = tolerantEnum(
  ["draft", "published", "paused", "filled", "closed", "expired", "unknown"],
  "unknown",
);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const adminJobListItemSchema = z.object({
  jobId: z.string(),
  jobSerialNumber: serialNumberSchema.optional(),
  title: z.string(),
  companyProfileId: z.string(),
  companyUserId: z.string().catch(""),
  companySerialNumber: serialNumberSchema.optional(),
  companyName: z.string(),
  hasLogo: z.boolean().catch(false),
  status: jobStatusSchema,
  recruiterFeeMinor: z.number(),
  locationState: z.string().nullable(),
  candidateCount: z.number(),
  // The counts behind the board's Stage cell; the label is the client's.
  interviewingCount: z.number().catch(0),
  offeredCount: z.number().catch(0),
  hiredCount: z.number().catch(0),
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

/** Per-item outcome of a bulk job action — one bad row never aborts the batch. */
export const bulkJobActionResultSchema = z.object({
  succeeded: z.number(),
  failed: z.array(z.object({ jobId: z.string(), reason: z.string() })),
});
export type BulkJobActionResult = z.infer<typeof bulkJobActionResultSchema>;

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
  firstName: z.string().transform(titleCase),
  lastName: z.string().transform(titleCase),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

/* ── Finance: company payments ─────────────────────────────────────────── */

/** The tabs on the company payments board, in the order they are shown. */
export const PAYMENT_VIEWS = [
  "all",
  "deposits",
  "reservations",
  "settlements",
  "refunds",
  "other",
  "failed",
] as const;
export type PaymentView = (typeof PAYMENT_VIEWS)[number];

export const paymentStatusSchema = z.enum(["pending", "succeeded", "failed"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/**
 * What the wallet movement was. The server sends the raw entry type and the
 * client supplies the wording — the same split every other board here uses.
 * `.catch` keeps an entry type we have not met yet from failing the parse and
 * blanking the whole page; it renders under its own name.
 */
export const ledgerEntryTypeSchema = z
  .enum([
    "credit",
    "debit",
    "reserve",
    "release_reserve",
    "hold",
    "release_hold",
    "refund",
    "payout",
  ])
  .catch("debit");
export type LedgerEntryType = z.infer<typeof ledgerEntryTypeSchema>;

export const adminPaymentSchema = z.object({
  id: z.string(),
  source: z.enum(["ledger", "transaction"]),
  serialNumber: serialNumberSchema.nullable(),
  companyProfileId: z.string(),
  companyUserId: z.string(),
  companySerialNumber: serialNumberSchema,
  companyName: z.string(),
  entryType: ledgerEntryTypeSchema,
  amountMinor: z.number(),
  balanceDeltaMinor: z.number(),
  reservedDeltaMinor: z.number(),
  balanceAfterMinor: z.number().nullable(),
  reservedAfterMinor: z.number().nullable(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  referenceSerialNumber: serialNumberSchema.nullable(),
  referenceLabel: z.string().nullable(),
  description: z.string().nullable(),
  status: paymentStatusSchema,
  providerRef: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminPayment = z.infer<typeof adminPaymentSchema>;

export const paymentCountsSchema = z.object({
  all: z.number(),
  deposits: z.number(),
  reservations: z.number(),
  settlements: z.number(),
  refunds: z.number(),
  other: z.number(),
  failed: z.number(),
});
export type PaymentCounts = z.infer<typeof paymentCountsSchema>;

export const paymentsSummarySchema = z.object({
  balanceMinor: z.number(),
  availableMinor: z.number(),
  reservedMinor: z.number(),
  fundedWallets: z.number(),
  refundedMinor: z.number(),
  refundCount: z.number(),
  windowDays: z.number(),
});
export type PaymentsSummary = z.infer<typeof paymentsSummarySchema>;

/* ── Finance: recruiter payouts ────────────────────────────────────────── */

export const PAYOUT_VIEWS = [
  "all",
  "in_guarantee",
  "ready",
  "on_hold",
  "processing",
  "paid",
  "refunded",
] as const;
export type PayoutView = (typeof PAYOUT_VIEWS)[number];

export const PAYOUT_HOLD_REASONS = [
  "account_review",
  "payout_account",
  "compliance",
  "other",
] as const;
export type PayoutHoldReason = (typeof PAYOUT_HOLD_REASONS)[number];

export const adminPayoutSchema = z.object({
  placementId: z.string(),
  placementSerialNumber: serialNumberSchema,
  view: z.enum(PAYOUT_VIEWS),
  placementStatus: z.string(),
  recruiterProfileId: z.string(),
  recruiterUserId: z.string(),
  recruiterSerialNumber: serialNumberSchema,
  recruiterName: z.string().transform(titleCase),
  companyProfileId: z.string(),
  companyUserId: z.string(),
  companySerialNumber: serialNumberSchema,
  companyName: z.string(),
  candidateId: z.string(),
  candidateSerialNumber: serialNumberSchema,
  candidateName: z.string(),
  jobId: z.string(),
  jobSerialNumber: serialNumberSchema,
  jobTitle: z.string(),
  commissionMinor: z.number(),
  joiningDate: z.string(),
  eligibleAt: z.string(),
  releasedAt: z.string().nullable(),
  openDisputeId: z.string().nullable(),
  openDisputeSerialNumber: serialNumberSchema.nullable(),
  manualHoldCount: z.number(),
});
export type AdminPayout = z.infer<typeof adminPayoutSchema>;

export const payoutHoldSchema = z.object({
  id: z.string().nullable(),
  kind: z.enum(["dispute", "manual"]),
  reason: z.enum(PAYOUT_HOLD_REASONS).nullable(),
  note: z.string().nullable(),
  disputeId: z.string().nullable(),
  disputeSerialNumber: serialNumberSchema.nullable(),
  createdAt: z.string(),
  createdByName: z.string().nullable(),
  releasedAt: z.string().nullable(),
  releasedByName: z.string().nullable(),
  releaseNote: z.string().nullable(),
  active: z.boolean(),
});
export type PayoutHold = z.infer<typeof payoutHoldSchema>;

export const PAYOUT_EVENT_KINDS = [
  "offer_accepted",
  "candidate_joined",
  "dispute_opened",
  "dispute_resolved",
  "hold_added",
  "hold_released",
  "guarantee_ends",
  "released",
  "refunded",
] as const;

export const payoutEventSchema = z.object({
  key: z.string(),
  kind: z.enum(PAYOUT_EVENT_KINDS),
  at: z.string().nullable(),
  actorName: z.string().nullable(),
  referenceSerialNumber: serialNumberSchema.nullable(),
  reason: z.string().nullable(),
  note: z.string().nullable(),
});
export type PayoutEvent = z.infer<typeof payoutEventSchema>;

export const adminPayoutDetailSchema = adminPayoutSchema.extend({
  offerId: z.string(),
  holds: z.array(payoutHoldSchema),
  timeline: z.array(payoutEventSchema),
  destination: z
    .object({
      bankName: z.string().nullable(),
      bankLast4: z.string().nullable(),
      status: z.string().nullable(),
      disabledReason: z.string().nullable(),
      updatedAt: z.string().nullable(),
    })
    .nullable(),
  funding: z
    .object({
      serialNumber: serialNumberSchema.nullable(),
      reservedAt: z.string().nullable(),
      amountMinor: z.number(),
    })
    .nullable(),
});
export type AdminPayoutDetail = z.infer<typeof adminPayoutDetailSchema>;

const payoutViewTotalSchema = z.object({
  count: z.number(),
  amountMinor: z.number(),
});

export const payoutsSummarySchema = z.object({
  inGuarantee: payoutViewTotalSchema,
  ready: payoutViewTotalSchema,
  onHold: payoutViewTotalSchema,
  processing: payoutViewTotalSchema,
  paid: payoutViewTotalSchema,
  refunded: payoutViewTotalSchema,
  activeHolds: z.number(),
});
export type PayoutsSummary = z.infer<typeof payoutsSummarySchema>;
