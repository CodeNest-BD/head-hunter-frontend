import { z } from "zod";

// Imported from the schemas module directly, not the feature barrel: the
// barrel also re-exports InboxTable and its hooks, which pull in
// features/jobs' API client — this file only needs the dependency-free
// status list (schemas.ts imports nothing but zod).
import { SUBMISSION_STATUSES } from "@/features/submissions/schemas";
import { paginatedSchema } from "@/shared/libs/pagination";

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
  type: z
    .enum([
      "submission",
      "candidate",
      "proposal",
      "hire_response",
      "offer",
      "message",
      "unknown",
    ])
    .catch("unknown"),
  at: z.string(),
  actor: z.enum(["company", "recruiter", "system"]).nullable(),
  title: z.string(),
  body: z.string().nullable(),
  candidateId: z.string().nullable(),
  messageId: z.string().nullable(),
});
export type ConversationEvent = z.infer<typeof conversationEventSchema>;

export const conversationCandidateRefSchema = z.object({
  id: z.string(),
  fullName: z.string(),
});
export type ConversationCandidateRef = z.infer<
  typeof conversationCandidateRefSchema
>;

/**
 * A participant's view of a thread: the shared header (company, recruiter,
 * job, candidates) plus one page of its entries. `events` is the API's
 * `{ data, meta }` envelope, not a bare array — the same envelope every other
 * paginated list endpoint returns — so `useConversationThread` can page
 * through history with `paginatedSchema` rather than a bespoke shape.
 */
export const conversationThreadSchema = z.object({
  submissionId: z.string(),
  // Same forward tolerance as `type` above: a sixth submission status added
  // server-side should degrade this one field, not fail the whole thread.
  status: z.enum([...SUBMISSION_STATUSES, "unknown"] as const).catch("unknown"),
  company: z.object({ profileId: z.string(), name: z.string() }),
  recruiter: z.object({ profileId: z.string(), name: z.string() }),
  job: z.object({ id: z.string(), title: z.string() }),
  candidates: z.array(conversationCandidateRefSchema),
  events: paginatedSchema(conversationEventSchema),
});
export type ConversationThread = z.infer<typeof conversationThreadSchema>;

export const unreadCountSchema = z.object({ unread: z.number() });

/** Short-lived HS256 token minted by the Nest API for Supabase Realtime auth. */
export const realtimeTokenSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
});
export type RealtimeToken = z.infer<typeof realtimeTokenSchema>;

export const markReadResponseSchema = z.object({ updated: z.number() });

/** The stored message the send endpoint returns. Only the fields the UI reads. */
export const messageSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  candidateId: z.string().nullable(),
  senderParty: z.enum(["company", "recruiter"]),
  body: z.string().nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});
export type Message = z.infer<typeof messageSchema>;
