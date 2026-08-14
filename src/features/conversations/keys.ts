import type { ThreadParams } from "./api/conversations";

export const conversationKeys = {
  all: ["conversations"] as const,
  thread: (submissionId: string, params: ThreadParams) =>
    ["conversations", "thread", submissionId, params] as const,
  unreadCount: ["conversations", "unread-count"] as const,
  unreadCounts: ["conversations", "unread-counts"] as const,
};
