/**
 * How often the badge-bearing queries refetch: notifications, message unread
 * counts, and the inbox/submission/negotiation surfaces.
 *
 * These have no push transport of their own, so a poll is what makes them feel
 * live. Cost is bounded — the API throttles per route per IP at 60/minute, so
 * one query spends 12 of its own budget. `refetchIntervalInBackground` is left
 * off everywhere, so a hidden tab stops polling.
 */
export const REALTIME_POLL_MS = 5_000;
