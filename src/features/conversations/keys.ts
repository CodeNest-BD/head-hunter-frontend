import type { ThreadParams } from "./api/conversations";

export const conversationKeys = {
  all: ["conversations"] as const,
  thread: (candidateId: string, params: ThreadParams) =>
    ["conversations", "thread", candidateId, params] as const,
  unreadCount: ["conversations", "unread-count"] as const,
  unreadCounts: ["conversations", "unread-counts"] as const,
};
