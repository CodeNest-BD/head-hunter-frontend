import { useQuery } from "@tanstack/react-query";

import { fetchMessageUnreadCounts } from "../api/conversations";
import { conversationKeys } from "../keys";

/**
 * Unread messages per submission, as a Map so a list can look each row up in
 * O(1) instead of scanning an array per row.
 */
export function useMessageUnreadCounts() {
  return useQuery({
    queryKey: conversationKeys.unreadCounts,
    queryFn: fetchMessageUnreadCounts,
    // Overrides the global refetchOnWindowFocus: false default (see
    // useConversation.ts's thread query for the same override) — this is the
    // safety net for a dropped frame. useUnreadRealtime (mounted once in
    // DashboardLayout) invalidates this on message.created/negotiation.changed,
    // so it no longer needs its own poll.
    refetchOnWindowFocus: true,
    select: (counts) =>
      new Map(counts.map((count) => [count.submissionId, count.unread])),
  });
}
