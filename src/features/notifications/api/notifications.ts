import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  notificationSchema,
  unreadCountSchema,
  type Notification,
} from "../schemas";

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  candidateId?: string;
}

/** GET /v1/notifications */
export async function fetchNotifications(
  params: NotificationListParams,
): Promise<Paginated<Notification>> {
  const { data } = await apiClient.get<unknown>("/notifications", { params });
  return paginatedSchema(notificationSchema).parse(data);
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

/** PATCH /v1/notifications/:id/unread — flag a read notification for later. */
export async function markNotificationUnread(
  id: string,
): Promise<Notification> {
  const { data } = await apiClient.patch<unknown>(
    `/notifications/${id}/unread`,
  );
  return notificationSchema.parse(data);
}

/** POST /v1/notifications/read-all */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}
