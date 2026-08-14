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

/**
 * One conversation's worth of notifications. A notification with no
 * submission — payout, subscription, followed-company-posted-job — comes
 * back as a group of one keyed by its own id, so the client renders a single
 * shape rather than branching between "group" and "loose row".
 */
export const notificationGroupSchema = z.object({
  key: z.string(),
  submissionId: z.string().nullable(),
  jobTitle: z.string().nullable(),
  counterpartyName: z.string().nullable(),
  total: z.number(),
  unread: z.number(),
  items: z.array(notificationSchema),
  latestAt: z.coerce.date(),
});
export type NotificationGroup = z.infer<typeof notificationGroupSchema>;
