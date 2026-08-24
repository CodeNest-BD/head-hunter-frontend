import { useQueryClient } from "@tanstack/react-query";

// The keys module, not the barrel: this hook only needs the static key
// array, and the barrel would pull the inbox components in behind it.
import { inboxKeys } from "@/features/inbox/keys";

import { CONVERSATION_EVENT } from "../events";
import { conversationKeys } from "../keys";
import { useConversationSocket } from "./useConversationSocket";

/**
 * Keeps the unread badges live on every page, not just inside a thread.
 *
 * useConversationRealtime does the same invalidation but only while a submission
 * thread is mounted, which is why the badge queries used to poll every 5s. This is
 * the global counterpart: one subscription, mounted once by the dashboard layout.
 *
 * Carries no payload data — it only invalidates, so the authorized REST read stays
 * the single source of truth and a dropped frame self-heals on the next event or
 * window focus.
 *
 * Connecting the shared socket, and reviving it after the gateway refuses a stale
 * token's handshake, is `useConversationSocket`'s concern — shared with
 * `useConversationRealtime` rather than restated here. That matters most on this
 * hook's pages (inbox list, submissions, dashboard, jobs), where no thread is
 * mounted to reconnect on its behalf and there is no longer a poll to mask it.
 */
export function useUnreadRealtime(): void {
  const queryClient = useQueryClient();

  const invalidateUnreadCounts = (): void => {
    void queryClient.invalidateQueries({
      queryKey: conversationKeys.unreadCount,
    });
    void queryClient.invalidateQueries({
      queryKey: conversationKeys.unreadCounts,
    });
    // Prefix key: the nav badge and the inbox rows both carry unread counts,
    // so one message makes both stale.
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  };

  useConversationSocket({
    [CONVERSATION_EVENT.MESSAGE_CREATED]: invalidateUnreadCounts,
    [CONVERSATION_EVENT.NEGOTIATION_CHANGED]: invalidateUnreadCounts,
  });
}
