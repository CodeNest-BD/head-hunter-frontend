import { addDays, addMinutes, format, isSameDay, max } from "date-fns";

import {
  formatDate,
  formatDateTime,
  formatTime,
} from "@/shared/utils/formatDate";
import {
  SLOT_TIME_STEP_MINUTES,
  type Interview,
  type ProposeSlotFormValues,
  type SlotDurationMinutes,
} from "../schemas";

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

/** "09:30" → 570. The list is `HH:mm` throughout, so this never sees a date. */
function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * The end times offerable for a window that starts at `startTime`: every
 * option later in the same day. Empty near midnight, which the caller reads as
 * "this window is a single slot" rather than as an error — the company is
 * still allowed to offer 11:45 PM.
 */
export function selectableEndTimes(
  startTime: string,
  dayOptions: readonly SlotTimeOption[],
): readonly SlotTimeOption[] {
  if (!startTime) return [];
  const start = toMinutes(startTime);
  return dayOptions.filter((option) => toMinutes(option.value) > start);
}

/**
 * A hiring manager's availability window → the back-to-back interview slots
 * inside it.
 *
 * The company told us "Tuesday, 9:00 AM to 11:00 AM, one hour each"; the API
 * stores a shortlist of discrete windows, so 9–11 at 60 minutes becomes 9:00
 * and 10:00. This is what spares a company from adding every start time by
 * hand, which is what the client reported as redundant.
 *
 * A window too short to hold one full length still yields exactly one slot: a
 * company that picked 9:00–9:15 with a 30-minute length meant an interview at
 * 9:00, not nothing. The trailing remainder of a longer window is dropped —
 * 9:00–11:45 at 60 minutes is 9:00 and 10:00, never a 45-minute stub that
 * disagrees with the length on screen.
 *
 * Deliberately NOT capped at `MAX_PROPOSAL_SLOTS`: this returns what the
 * window actually holds, and the caller caps it. Capping here hid the
 * difference — a 9:00–17:00 window at 30 minutes would quietly become five
 * slots with no hint that eleven more were dropped.
 */
export function expandWindow({
  day,
  startTime,
  endTime,
  durationMinutes,
}: {
  day: string;
  startTime: string;
  endTime: string;
  durationMinutes: SlotDurationMinutes;
}): ProposeSlotFormValues[] {
  const start = toMinutes(startTime);
  const end = endTime === "" ? start : toMinutes(endTime);
  const slots: ProposeSlotFormValues[] = [];
  for (let at = start; at + durationMinutes <= end; at += durationMinutes) {
    slots.push({
      day,
      startTime: `${pad(Math.floor(at / 60))}:${pad(at % 60)}`,
      durationMinutes,
    });
  }
  return slots.length > 0 ? slots : [{ day, startTime, durationMinutes }];
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

/**
 * The earliest day an offer's start date may fall on for this interview: the
 * day after the last time the interview could still take place. `""` when the
 * interview carries no time at all — nothing to clear, so the picker keeps
 * only its usual "not in the past" floor.
 *
 * A proposed batch counts by its *latest* slot, not its first: any one of
 * those times can still be the one confirmed, so a floor built on the earliest
 * would let a company promise a start date that falls before the interview it
 * is still waiting on. That is the case in the report this exists for — times
 * proposed for the 19th, a start date picked for the 18th.
 */
export function firstStartDayAfterInterview(
  interview: Interview | null,
): string {
  const lastPossible = lastInterviewInstant(interview);
  return lastPossible ? format(addDays(lastPossible, 1), "yyyy-MM-dd") : "";
}

function lastInterviewInstant(interview: Interview | null): Date | null {
  if (!interview) return null;
  // A canceled or completed interview is history: its times must not hold the
  // start date back, and a canceled one may still carry a future slot.
  if (interview.status !== "proposed" && interview.status !== "scheduled") {
    return null;
  }
  if (interview.confirmedSlotEnd) return new Date(interview.confirmedSlotEnd);
  const slotEnds = (interview.liveProposal?.slots ?? []).map(
    (slot) => new Date(slot.endAt),
  );
  return slotEnds.length > 0 ? max(slotEnds) : null;
}
