import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificationGroups,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationGroupListParams,
  type NotificationListParams,
} from "../api/notifications";
import { notificationKeys } from "../keys";

/**
 * `enabled` defaults to true for the plain list, but a group's expansion
 * passes false until the caller opens it — the flat endpoint mints a real
 * query, so there is no point fetching it for a group nobody expanded.
 */
export function useNotifications(
  params: NotificationListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    enabled,
  });
}

export function useNotificationGroups(params: NotificationGroupListParams) {
  return useQuery({
    queryKey: notificationKeys.groups(params),
    queryFn: () => fetchNotificationGroups(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadCount,
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

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
