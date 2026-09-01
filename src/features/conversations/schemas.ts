import { z } from "zod";

// Imported from the schemas module directly, not the feature barrel: the
// barrel pulls in components and hooks, and this file only needs the
// dependency-free candidate shape (candidates/schemas.ts imports nothing but
// zod and the money helpers).
import { titleCase } from "@/shared/utils/titleCase";

import { candidateSchema } from "@/features/candidates/schemas";
import { paginatedSchema } from "@/shared/libs/pagination";
import { tolerantEnum } from "@/shared/libs/zodTolerantEnum";

/**
 * Shared by this feature's participant thread and the admin conversation
 * viewer (`features/admin/schemas.ts`, which imports this definition directly
 * rather than duplicating it) — both render the same event feed.
 *
 * `type` degrades to "unknown" instead of failing the parse: the backend adds
 * event types over time (interviews and offers next), and a thread that
 * throws on an unfamiliar entry is worse than one that renders it plainly.
 * Same rationale as the notifications feature's permissive `type`.
 */
export const conversationEventSchema = z.object({
  type: tolerantEnum(
    [
      "submission",
      "candidate",
      "proposal",
      "interview",
      "hire_response",
      "offer",
      "message",
      "unknown",
    ],
    "unknown",
  ),
  at: z.string(),
  actor: z.enum(["company", "recruiter", "system"]).nullable(),
  title: z.string(),
  body: z.string().nullable(),
  candidateId: z.string().nullable(),
  messageId: z.string().nullable(),
  data: z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("proposal"),
        interviewId: z.string(),
        availabilityProposalId: z.string(),
        proposalStatus: tolerantEnum(
          ["proposed", "counter_requested", "confirmed", "expired", "unknown"],
          "unknown",
        ),
        // The interview's own status, carried next to the proposal's because
        // the two can disagree: a batch stays "proposed" right up to the
        // moment the interview around it is canceled or completed, and a card
        // that knew only the proposal status would keep offering Confirm on
        // a dead interview.
        interviewStatus: tolerantEnum(
          ["proposed", "scheduled", "completed", "canceled", "unknown"],
          "unknown",
        ),
        // The agreed time, non-null once a slot won — the slot list never
        // says which one it was, so the card renders directly from these
        // instead of fetching the interview just to name the confirmed time.
        confirmedSlotStart: z.string().nullable(),
        confirmedSlotEnd: z.string().nullable(),
        slots: z.array(
          z.object({ id: z.string(), startAt: z.string(), endAt: z.string() }),
        ),
      }),
      z.object({
        kind: z.literal("interview"),
        interviewId: z.string(),
        interviewStatus: tolerantEnum(
          ["proposed", "scheduled", "completed", "canceled", "unknown"],
          "unknown",
        ),
      }),
      z.object({
        kind: z.literal("offer"),
        offerId: z.string(),
        offerStatus: tolerantEnum(
          [
            "sent",
            "accepted",
            "declined",
            "countered",
            "superseded",
            "unknown",
          ],
          "unknown",
        ),
        // The recruiter's commission — display only, never editable from this
        // feed; the amount a client could edit is exactly the escrow-inflation
        // the backend's server-side-only `amountMinor` rule prevents.
        amountMinor: z.number(),
        salaryMinor: z.number().nullable(),
        jobTitle: z.string().nullable(),
        startDate: z.string().nullable(),
        previousOfferId: z.string().nullable(),
        createdBy: z.enum(["company", "recruiter"]),
      }),
    ])
    // A payload kind this build does not know about degrades to null rather
    // than failing the whole thread parse — slice C adds an `offer` variant.
    .nullable()
    .catch(null),
});
export type ConversationEvent = z.infer<typeof conversationEventSchema>;

/**
 * Everything that describes a thread itself rather than its entries — mirrors
 * the backend's `ConversationThreadHeaderDto`, which both the admin and
 * participant views extend, so the header can never drift between them.
 *
 * It carries the whole candidate rather than a reference: this header is what
 * renders the candidate pane beside the conversation, so the split view costs
 * one request instead of two.
 */
export const conversationThreadHeaderSchema = z.object({
  candidate: candidateSchema,
  company: z.object({ profileId: z.string(), name: z.string() }),
  recruiter: z.object({
    profileId: z.string(),
    name: z.string().transform(titleCase),
  }),
  job: z.object({
    id: z.string(),
    title: z.string(),
    recruiterFeeMinor: z.number(),
  }),
  /** False once the candidate is passed on: readable, closed to new messages. */
  acceptsMessages: z.boolean(),
});

/**
 * A participant's view of a thread: the shared header plus one page of
 * entries. `events` is the API's `{ data, meta }` envelope, not a bare array —
 * the same envelope every other paginated list endpoint returns — so
 * `useConversationThread` can page through history with `paginatedSchema`
 * rather than a bespoke shape.
 */
export const conversationThreadSchema = conversationThreadHeaderSchema.extend({
  events: paginatedSchema(conversationEventSchema),
});
export type ConversationThread = z.infer<typeof conversationThreadSchema>;

export const unreadCountSchema = z.object({ unread: z.number() });

/** Unread messages per candidate; `jobId` rides along for the inbox rollup. */
export const candidateUnreadCountsSchema = z.object({
  counts: z.array(
    z.object({
      candidateId: z.string(),
      jobId: z.string(),
      unread: z.number(),
    }),
  ),
});

export const markReadResponseSchema = z.object({ updated: z.number() });

/**
 * The stored message the send endpoint returns. Only the fields the UI reads
 * — the composer only clears itself on success, nothing consumes `readAt` or
 * `createdAt` as a `Date`, so they stay `z.string()` like every other
 * timestamp in this file rather than mixing in a second coercion convention.
 */
export const messageSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  senderParty: z.enum(["company", "recruiter"]),
  body: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof messageSchema>;
