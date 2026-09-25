import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { disputeKeys } from "@/features/disputes/keys";
import { inboxKeys } from "@/features/inbox/keys";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  type NotificationListParams,
} from "../api/notifications";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
import { notificationKeys } from "../keys";

/**
 * `enabled` defaults to true, but callers can gate the query off until a
 * condition is met (e.g. a panel is opened) to avoid a wasted fetch.
 */
/**
 * Notifications have no realtime transport: the only websocket event is
 * `message.created`, and it invalidates conversation keys, never these. Without
 * a poll, a notification only appeared when something happened to remount the
 * query — so the badge sat stale for as long as the user stayed on a page.
 *
 * Both queries therefore poll and refetch on focus (overriding the app-wide
 * `refetchOnWindowFocus: false`). `refetchIntervalInBackground` is left off, so
 * a hidden tab stops polling and the focus refetch covers coming back to it.
 */
export function useNotifications(
  params: NotificationListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    enabled,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/** A notification's read state is also what the inbox rows, the inbox badge
 * and the disputes list's "new" marker read, so every read/unread mutation
 * refreshes them alongside the bell's list and badge. */
function invalidateReadState(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  void queryClient.invalidateQueries({ queryKey: disputeKeys.lists });
  void queryClient.invalidateQueries({ queryKey: disputeKeys.attentionCount });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => invalidateReadState(queryClient),
  });
}

export function useMarkUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationUnread(id),
    onSuccess: () => invalidateReadState(queryClient),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateReadState(queryClient),
  });
}
