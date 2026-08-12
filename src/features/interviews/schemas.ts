import { z } from "zod";

/**
 * Interview and proposal statuses are read live from `/v1/interviews`, not
 * replayed from a historical feed the way conversation events are — an
 * unrecognised value here means this client is genuinely out of date, so it
 * fails the parse loudly rather than degrading (unlike the tolerant
 * `type`/`status` fields in `features/conversations/schemas.ts`).
 */
export const INTERVIEW_TYPES = [
  "phone",
  "video",
  "video_panel",
  "in_person",
] as const;
export const interviewTypeSchema = z.enum(INTERVIEW_TYPES);
export type InterviewType = z.infer<typeof interviewTypeSchema>;

export const INTERVIEW_STATUSES = [
  "proposed",
  "scheduled",
  "completed",
  "canceled",
] as const;
export const interviewStatusSchema = z.enum(INTERVIEW_STATUSES);
export type InterviewStatus = z.infer<typeof interviewStatusSchema>;

export const INTERVIEW_OUTCOMES = ["offer", "next_round", "pass"] as const;
export const interviewOutcomeSchema = z.enum(INTERVIEW_OUTCOMES);
export type InterviewOutcome = z.infer<typeof interviewOutcomeSchema>;

export const PROPOSAL_STATUSES = [
  "proposed",
  "counter_requested",
  "confirmed",
  "expired",
] as const;
export const proposalStatusSchema = z.enum(PROPOSAL_STATUSES);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

/** One candidate window within a batch of proposed times. */
export const interviewSlotSchema = z.object({
  id: z.string(),
  startAt: z.string(),
  endAt: z.string(),
});
export type InterviewSlot = z.infer<typeof interviewSlotSchema>;

/**
 * Mirrors `InterviewResponseDto` — the entity's internal `recruiterProfileId`
 * / `companyProfileId` are deliberately absent, same as on the backend.
 */
export const interviewSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  candidateId: z.string(),
  interviewType: interviewTypeSchema,
  status: interviewStatusSchema,
  round: z.number(),
  confirmedSlotStart: z.string().nullable(),
  confirmedSlotEnd: z.string().nullable(),
  meetingJoinUrl: z.string().nullable(),
  outcome: interviewOutcomeSchema.nullable(),
  passFeedback: z.string().nullable(),
  createdAt: z.string(),
});
export type Interview = z.infer<typeof interviewSchema>;

/** Mirrors `ProposalResponseDto` — the direct response to propose/confirm/counter. */
export const proposalSchema = z.object({
  id: z.string(),
  status: proposalStatusSchema,
  note: z.string().nullable(),
  slots: z.array(interviewSlotSchema),
});
export type Proposal = z.infer<typeof proposalSchema>;

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  video_panel: "Video panel",
  in_person: "In person",
};

/**
 * A batch is a shortlist for a human to pick from, not an open calendar — the
 * same 1-5 cap the backend's `ProposeSlotsDto` enforces.
 */
export const MIN_PROPOSAL_SLOTS = 1;
export const MAX_PROPOSAL_SLOTS = 5;

/**
 * How long a proposed window lasts. A closed set of interview lengths (rather
 * than a free end time) is what makes "ends before it starts" unrepresentable
 * in the form — the end is derived, never typed.
 */
const slotDurationSchema = z.union([
  z.literal(30),
  z.literal(45),
  z.literal(60),
  z.literal(90),
]);
export type SlotDurationMinutes = z.infer<typeof slotDurationSchema>;
export const SLOT_DURATION_OPTIONS: readonly SlotDurationMinutes[] = [
  30, 45, 60, 90,
];

/** The granularity of the start-time list — every calendar tool's default. */
export const SLOT_TIME_STEP_MINUTES = 15;

/**
 * One proposed window as the form holds it: a calendar day the company picked,
 * a wall-clock start, and a length. `toSlotRange` turns that into the ISO
 * instants the API stores. The "starts in the future" and "does not overlap
 * another slot in this batch" rules stay server-side and surface through
 * `proposeSlots`'s 400 message, since duplicating a pairwise-overlap check
 * here would drift from `SlotsDoNotOverlapConstraint` the moment either side
 * changes.
 */
const proposeSlotFormSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  durationMinutes: slotDurationSchema,
});
export type ProposeSlotFormValues = z.infer<typeof proposeSlotFormSchema>;

export const proposeSlotsFormSchema = z.object({
  slots: z
    .array(proposeSlotFormSchema)
    .min(MIN_PROPOSAL_SLOTS, `Propose at least ${MIN_PROPOSAL_SLOTS} time`)
    .max(MAX_PROPOSAL_SLOTS, `Propose at most ${MAX_PROPOSAL_SLOTS} times`),
});
export type ProposeSlotsFormValues = z.infer<typeof proposeSlotsFormSchema>;
