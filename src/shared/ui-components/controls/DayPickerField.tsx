"use client";

import * as Popover from "@radix-ui/react-popover";
import { format, max, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Calendar } from "./calendar";

/** The wire format every day field in this app holds: a local calendar day
 * with no offset, which is what the API's date-only columns store. */
const DAY_FORMAT = "yyyy-MM-dd";

/** A day string round-trips through the calendar as a local `Date`; an empty
 * (not-yet-picked) day has no date to select. */
function toSelectedDate(day: string): Date | undefined {
  return day ? new Date(`${day}T00:00`) : undefined;
}

export interface DayPickerFieldProps {
  /** Matches the `<Label htmlFor>` the caller renders above the field. */
  id: string;
  /** `yyyy-MM-dd`, or `""` for "not picked yet". */
  value: string;
  onChange: (day: string) => void;
  /** Shown in place of a date until one is picked. */
  placeholder: string;
  /** The field's accessible name, on both the trigger and the calendar. The
   * trigger is a button showing a placeholder until a day is picked, so
   * without this a caller with no `<label for>` would announce it as "Pick a
   * start day". */
  ariaLabel: string;
  /** `yyyy-MM-dd` floor above today's, for a day that also has to clear
   * another one — a range's end against its start. Never lowers the floor. */
  minDay?: string;
  className?: string;
}

/**
 * The app's "pick a calendar day" field: a `yyyy-MM-dd` string behind a
 * calendar popover, with past days off the grid.
 *
 * Every day a user picks in this product is a day in the future — an interview
 * window, an offer's start date — so the floor is the component's rule rather
 * than each caller's. The server still owns the finer-grained checks (a time
 * earlier today, a start date the counterparty's timezone reads differently);
 * this only closes off the obvious half, before a round-trip.
 */
export function DayPickerField({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  minDay = "",
  className,
}: DayPickerFieldProps) {
  const selectedDate = toSelectedDate(value);
  const minDate = toSelectedDate(minDay);
  const firstSelectableDay = minDate
    ? max([minDate, startOfToday()])
    : startOfToday();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <span
            className={
              selectedDate ? "text-foreground" : "text-muted-foreground"
            }
          >
            {selectedDate
              ? format(selectedDate, "EEE, d MMM yyyy")
              : placeholder}
          </span>
          <CalendarIcon
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-md border border-border bg-card p-2 shadow-card-lg focus:outline-none"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate ?? firstSelectableDay}
            disabled={{ before: firstSelectableDay }}
            onSelect={(date) => onChange(date ? format(date, DAY_FORMAT) : "")}
            aria-label={ariaLabel}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
