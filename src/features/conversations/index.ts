"use client";

// The barrel is a client boundary: it re-exports hooks and components that use
// client-only React APIs, so a Server Component importing this file must not
// pull them into the server graph.
/** Public surface of the conversations feature. */
export { OfferCard } from "./components/OfferCard";
export type { OfferEventData } from "./components/OfferCard";
export { ProposalCard } from "./components/ProposalCard";
export type { ProposalEventData } from "./components/ProposalCard";
export { Thread } from "./components/Thread";
export { UnreadBadge } from "./components/UnreadBadge";
export {
  useConversationThread,
  useMarkThreadRead,
  useMessageUnreadCount,
  useSendMessage,
} from "./hooks/useConversation";
export { useConversationRealtime } from "./hooks/useConversationRealtime";
export { useMessageUnreadCounts } from "./hooks/useMessageUnreadCounts";
export type { ConversationRealtimeStatus } from "./hooks/useConversationRealtime";
export { conversationKeys } from "./keys";
export type { ConversationEvent, ConversationThread } from "./schemas";
