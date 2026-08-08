/**
 * Display helpers for API timestamps, mirroring money.ts's role for money:
 * one conversion point instead of inlining Intl options at call sites.
 * formatDate renders the calendar date; formatDateTime adds the clock time
 * for feeds where the hour matters (e.g. the wallet ledger).
 */
const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: "numeric",
  minute: "2-digit",
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
