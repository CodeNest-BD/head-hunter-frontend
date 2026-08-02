"use client";

// The barrel is a client boundary: it re-exports hooks and components that
// use client-only React APIs, so a Server Component importing this file must
// not pull them into the server graph.
/** Public surface of the notifications feature. */
export { NotificationList } from "./components/NotificationList";
export {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "./hooks/useNotifications";
export { notificationKeys } from "./keys";
export type { Notification } from "./schemas";
