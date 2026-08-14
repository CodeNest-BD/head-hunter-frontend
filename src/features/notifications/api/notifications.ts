import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  notificationGroupSchema,
  notificationSchema,
  unreadCountSchema,
  type Notification,
  type NotificationGroup,
} from "../schemas";

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  submissionId?: string;
}

export interface NotificationGroupListParams {
  page?: number;
  limit?: number;
}

/** GET /v1/notifications */
export async function fetchNotifications(
  params: NotificationListParams,
): Promise<Paginated<Notification>> {
  const { data } = await apiClient.get<unknown>("/notifications", { params });
  return paginatedSchema(notificationSchema).parse(data);
}

/** GET /v1/notifications/grouped — stacked by submission, paginated over groups. */
export async function fetchNotificationGroups(
  params: NotificationGroupListParams,
): Promise<Paginated<NotificationGroup>> {
  const { data } = await apiClient.get<unknown>("/notifications/grouped", {
    params,
  });
  return paginatedSchema(notificationGroupSchema).parse(data);
}

/** GET /v1/notifications/unread-count */
export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<unknown>("/notifications/unread-count");
  return unreadCountSchema.parse(data).unread;
}

/** PATCH /v1/notifications/:id/read */
export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await apiClient.patch<unknown>(`/notifications/${id}/read`);
  return notificationSchema.parse(data);
}

/** POST /v1/notifications/read-all */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}
