"use client";

// The barrel is a client boundary: it re-exports hooks and components that use
// client-only React APIs, so a Server Component importing this file must not
// pull them into the server graph.
/** Public surface of the conversations feature. */
export { Thread } from "./components/Thread";
export {
  useConversationThread,
  useMarkThreadRead,
  useMessageUnreadCount,
  useSendMessage,
} from "./hooks/useConversation";
export { useConversationRealtime } from "./hooks/useConversationRealtime";
export type { ConversationRealtimeStatus } from "./hooks/useConversationRealtime";
export { conversationKeys } from "./keys";
export type { ConversationEvent, ConversationThread } from "./schemas";
