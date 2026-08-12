/**
 * Display helpers for API timestamps, mirroring money.ts's role for money:
 * one conversion point instead of inlining Intl options at call sites.
 * formatDate renders the calendar date; formatDateTime adds the clock time
 * for feeds where the hour matters (e.g. the wallet ledger); formatTime drops
 * the date for a pair of instants whose day is already stated once.
 */
const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  ...TIME_OPTIONS,
};

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** "2026-08-09" -> "Aug 9, 2026" */
export function formatDate(value: Date | string): string {
  return toDate(value).toLocaleDateString("en-US", DATE_OPTIONS);
}

/** "2026-08-09T14:05:00Z" -> "Aug 9, 2026, 2:05 PM" */
export function formatDateTime(value: Date | string): string {
  return toDate(value).toLocaleDateString("en-US", DATE_TIME_OPTIONS);
}

/** "2026-08-09T14:05:00Z" -> "2:05 PM", for a pair already known to share a
 * day (both ends of one interview window). */
export function formatTime(value: Date | string): string {
  return toDate(value).toLocaleTimeString("en-US", TIME_OPTIONS);
}
