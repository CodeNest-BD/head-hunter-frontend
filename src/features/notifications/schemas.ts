import { z } from "zod";

/**
 * `type` is a plain string rather than an enum: the backend adds notification
 * types over time, and an unknown value must render rather than fail the parse
 * and blank the whole list.
 */
export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  data: z.record(z.unknown()).nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const unreadCountSchema = z.object({ unread: z.number() });
