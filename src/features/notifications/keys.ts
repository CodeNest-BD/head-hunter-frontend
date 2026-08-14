import type {
  NotificationGroupListParams,
  NotificationListParams,
} from "./api/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) =>
    ["notifications", "list", params] as const,
  groups: (params: NotificationGroupListParams) =>
    ["notifications", "groups", params] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};
