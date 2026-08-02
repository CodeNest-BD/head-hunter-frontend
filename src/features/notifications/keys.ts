import type { NotificationListParams } from "./api/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) =>
    ["notifications", "list", params] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};
