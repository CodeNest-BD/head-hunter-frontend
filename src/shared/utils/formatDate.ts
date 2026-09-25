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

/** "2026-08-09" -> "Aug 9" — for near-future dates where the year is noise. */
export function formatMonthDay(value: Date | string): string {
  return toDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "2026-08-09T14:05:00Z" -> "2:05 PM", for a pair already known to share a
 * day (both ends of one interview window). */
export function formatTime(value: Date | string): string {
  return toDate(value).toLocaleTimeString("en-US", TIME_OPTIONS);
}

const START_OF_LOCAL_DAY = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * A short, human relative label by calendar day: "Today", "Yesterday",
 * "4 days ago", "2 weeks ago", "3 months ago". Pairs under an absolute date to
 * give a feed the "how long ago" read without the reader doing the arithmetic.
 */
export function formatRelativeDay(value: Date | string): string {
  const MS_PER_DAY = 86_400_000;
  const days = Math.round(
    (START_OF_LOCAL_DAY(new Date()) - START_OF_LOCAL_DAY(toDate(value))) /
      MS_PER_DAY,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "Last month";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * A span of time as its two largest units: "12 days 4 hours", "3 hours 20
 * minutes", "5 minutes". Under a minute reads "less than a minute".
 */
export function formatElapsed(ms: number): string {
  const units: [number, string][] = [
    [Math.floor(ms / 86_400_000), "day"],
    [Math.floor(ms / 3_600_000) % 24, "hour"],
    [Math.floor(ms / 60_000) % 60, "minute"],
  ];
  const firstNonZero = units.findIndex(([count]) => count > 0);
  if (firstNonZero === -1) return "less than a minute";
  return units
    .slice(firstNonZero, firstNonZero + 2)
    .flatMap(([count, unit]) =>
      count > 0 ? [`${count} ${unit}${count === 1 ? "" : "s"}`] : [],
    )
    .join(" ");
}

// `en-CA` is the shortest way to a "yyyy-mm-dd" string in the *local* calendar
// day; `toISOString()` would shift it a day for anyone west of UTC.
const ISO_DATE_LOCALE = "en-CA";

/** "2026-08-09" -> "2026-08-10", for a range whose end must clear its start. */
export function isoDateAfter(value: string): string {
  const next = new Date(`${value}T00:00:00`);
  next.setDate(next.getDate() + 1);
  return next.toLocaleDateString(ISO_DATE_LOCALE);
}
