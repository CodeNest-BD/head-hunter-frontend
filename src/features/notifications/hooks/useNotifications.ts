import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListParams,
} from "../api/notifications";

export const notificationsKey = (params: NotificationListParams) =>
  ["notifications", params] as const;
export const unreadCountKey = ["notifications", "unread-count"] as const;

export function useNotifications(params: NotificationListParams) {
  return useQuery({
    queryKey: notificationsKey(params),
    queryFn: () => fetchNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({ queryKey: unreadCountKey, queryFn: fetchUnreadCount });
}

/** Both mutations invalidate the list and the badge, which must stay in step. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
