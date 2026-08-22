import { addMinutes, isSameDay } from "date-fns";

import {
  formatDate,
  formatDateTime,
  formatTime,
} from "@/shared/utils/formatDate";
import { SLOT_TIME_STEP_MINUTES, type ProposeSlotFormValues } from "../schemas";

export interface SlotTimeOption {
  /** `HH:mm`, the form value. */
  value: string;
  /** Localised for reading, e.g. "3:15 PM". */
  label: string;
}

const MINUTES_PER_DAY = 24 * 60;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Every start time a company can offer, one step apart. Labels are built off a
 * fixed reference date so the list is identical on every render and in tests —
 * only the time-of-day part of that date is ever shown.
 */
function buildTimeOptions(): SlotTimeOption[] {
  const options: SlotTimeOption[] = [];
  for (
    let minutes = 0;
    minutes < MINUTES_PER_DAY;
    minutes += SLOT_TIME_STEP_MINUTES
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    options.push({
      value: `${pad(hour)}:${pad(minute)}`,
      label: formatTime(new Date(2000, 0, 1, hour, minute)),
    });
  }
  return options;
}

export const SLOT_TIME_OPTIONS: readonly SlotTimeOption[] = buildTimeOptions();

/**
 * The time options a user may actually pick for `day`. On a future day that is
 * all of them; on today it is only times still ahead of `now`.
 *
 * Exists because the picker previously offered the whole day regardless, so an
 * afternoon user was shown a default of 09:00 and the server correctly refused
 * it — the rejection the "must start in the future" error was reporting.
 *
 * `now` is a parameter rather than read inside, so this is testable without
 * faking the clock. It parses `${day}T${option.value}` as local time, matching
 * `toSlotRange` exactly — the two must agree on what e.g. "09:00" means.
 */
export function selectableTimeOptions(
  day: string,
  now: Date,
): readonly SlotTimeOption[] {
  if (!day) {
    return SLOT_TIME_OPTIONS;
  }
  const chosen = new Date(`${day}T00:00`);
  if (!isSameDay(chosen, now)) {
    return SLOT_TIME_OPTIONS;
  }
  return SLOT_TIME_OPTIONS.filter(
    (option) => new Date(`${day}T${option.value}`) > now,
  );
}

/**
 * The company's local day + start time + length → the UTC instants the API
 * stores. `new Date("yyyy-MM-ddTHH:mm")` is specified to parse as local time,
 * so the window means the same wall-clock hours the company saw on screen.
 */
export function toSlotRange({
  day,
  startTime,
  durationMinutes,
}: ProposeSlotFormValues): { startAt: string; endAt: string } {
  const start = new Date(`${day}T${startTime}`);
  return {
    startAt: start.toISOString(),
    endAt: addMinutes(start, durationMinutes).toISOString(),
  };
}

/**
 * The form's own preview of the window the recruiter will be offered:
 * "Aug 19, 2026 · 3:00 PM – 3:45 PM". A window whose length carries it past
 * midnight names both dates in full — "11:30 PM – 1:00 AM" under one date
 * would read as ending before it starts, and disagree with the instants
 * actually sent.
 */
export function formatSlotWindow(slot: ProposeSlotFormValues): string {
  const { startAt, endAt } = toSlotRange(slot);
  const start = new Date(startAt);
  const end = new Date(endAt);
  return start.toDateString() === end.toDateString()
    ? `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`;
}
