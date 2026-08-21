import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  type NotificationListParams,
} from "../api/notifications";
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
const UNREAD_COUNT_POLL_MS = 30_000;
const LIST_POLL_MS = 60_000;

export function useNotifications(
  params: NotificationListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    enabled,
    refetchInterval: LIST_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: UNREAD_COUNT_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/** Both mutations invalidate the list and the badge, which must stay in step. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationUnread(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
