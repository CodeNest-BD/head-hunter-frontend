import { format, isSameDay, subDays } from "date-fns";

export interface DaySeparatorProps {
  /** ISO timestamp of the first event on this calendar day. */
  date: string;
  /** The reference "now" the label is computed against. Defaults to the
   * real current time in the running app; tests must pass a fixed value
   * instead of relying on an argless `new Date()` so "Today"/"Yesterday"
   * assertions stay deterministic. */
  now?: Date;
}

/** Mirrors `formatDateTime`'s tolerance for a malformed timestamp: that
 * helper's `toLocaleDateString` degrades to the string "Invalid Date"
 * rather than throwing, but `date-fns`'s `isSameDay`/`format` throw
 * `RangeError` on an invalid `Date` — so this checks validity first and
 * degrades the same way instead of blanking the thread. */
function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, subDays(now, 1))) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

/** A centered pill marking a calendar-day boundary in the thread, computed
 * in the viewer's local timezone — the same timezone `formatDateTime` reads
 * from — so this never disagrees with the timestamp shown on a bubble right
 * next to it. */
export function DaySeparator({ date, now = new Date() }: DaySeparatorProps) {
  return (
    <div className="flex items-center justify-center py-1">
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {dayLabel(date, now)}
      </span>
    </div>
  );
}
