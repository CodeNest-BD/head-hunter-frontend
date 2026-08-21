import { useQuery } from "@tanstack/react-query";

import { fetchMessageUnreadCounts } from "../api/conversations";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
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
    // useConversation.ts's thread query for the same override) — these
    // badges are the only signal a message arrived now that message
    // notifications no longer appear in the feed, so mount-only staleness
    // would mean a user sitting on the inbox sees nothing until they navigate
    // away and back.
    refetchOnWindowFocus: true,
    refetchInterval: REALTIME_POLL_MS,
    select: (counts) =>
      new Map(counts.map((count) => [count.submissionId, count.unread])),
  });
}
