import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getConversationSocket } from "@/lib/socket";
import { CONVERSATION_EVENT } from "../events";
import { conversationKeys } from "../keys";

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
 * Also owns connecting the shared socket: `getConversationSocket()` returns it with
 * `autoConnect: false`, and outside a thread page `useConversationRealtime` isn't
 * mounted to do it — this is the one place guaranteed to run on every authenticated
 * page. `connect()` on an already-connected socket is a no-op, so this is safe to
 * run alongside a thread's own connect call.
 */
export function useUnreadRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getConversationSocket();
    if (!socket) {
      return;
    }

    const invalidateUnreadCounts = (): void => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCount,
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCounts,
      });
    };

    socket.on(CONVERSATION_EVENT.MESSAGE_CREATED, invalidateUnreadCounts);
    socket.on(CONVERSATION_EVENT.NEGOTIATION_CHANGED, invalidateUnreadCounts);
    socket.connect();

    return () => {
      socket.off(CONVERSATION_EVENT.MESSAGE_CREATED, invalidateUnreadCounts);
      socket.off(
        CONVERSATION_EVENT.NEGOTIATION_CHANGED,
        invalidateUnreadCounts,
      );
      // The socket is shared app-wide and deliberately left connected; only
      // this hook's listeners come off.
    };
  }, [queryClient]);
}
