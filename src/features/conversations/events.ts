/**
 * The conversations WebSocket contract, mirrored from the backend's
 * `libs/common/src/ws/conversation-events.ts`, which keeps these names in one
 * place for the same reason queue names do: two independently deployed sides
 * must read the same strings, or they drift apart. This is that one place on
 * the frontend — every socket listener imports from here instead of keeping
 * its own copy.
 */
export const CONVERSATION_EVENT = {
  MESSAGE_CREATED: "message.created",
  NEGOTIATION_CHANGED: "negotiation.changed",
} as const;
