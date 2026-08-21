/**
 * How often the badge-bearing queries refetch — notifications, message unread
 * counts, and the inbox/submission lists that carry unread pills.
 *
 * These surfaces have no push transport (the only websocket event is
 * `message.created`, scoped to one open thread), so a poll is what makes them
 * feel live. The interval is deliberately short because it drives badges the
 * user watches for new work.
 *
 * Cost is bounded: the backend throttler keys per route per IP at 60/minute, so
 * one query polling at this rate spends 12 of its own route's budget and never
 * competes with another route. `refetchIntervalInBackground` is left off
 * everywhere, so a hidden tab stops polling entirely and the focus refetch
 * covers the return.
 */
export const REALTIME_POLL_MS = 5_000;
