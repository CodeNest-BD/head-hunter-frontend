"use client";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import {
  HOURS_OF_DAY,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  formatHourOfDay,
  type JobFormValues,
} from "../schemas";

type Schedule = JobFormValues["daysAndHours"];

interface DaysAndHoursFieldProps {
  value: Schedule;
  onChange: (next: Schedule) => void;
}

/** One end of the range. Radix has no empty value, so "" reads as unpicked. */
function HourSelect({
  id,
  ariaLabel,
  placeholder,
  value,
  hours,
  onChange,
}: {
  id?: string;
  ariaLabel: string;
  placeholder: string;
  value: string;
  hours: readonly number[];
  onChange: (next: string) => void;
}) {
  return (
    <Select value={value === "" ? undefined : value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={ariaLabel} className="h-9 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {hours.map((hour) => (
          <SelectItem key={hour} value={String(hour)}>
            {formatHourOfDay(hour)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The role's schedule: day pills for the days it runs, and one hour range
 * covering all of them. A Mon–Thu 9–5 / Fri 9–1 role cannot be spelled out
 * exactly here and belongs in Position Details instead.
 */
export function DaysAndHoursField({ value, onChange }: DaysAndHoursFieldProps) {
  const selected = new Set(value.days);
  // The end can only come after the start, so the hours that would read
  // backwards are never offered — overnight shifts belong in Position Details.
  const endHours =
    value.startHour === ""
      ? HOURS_OF_DAY
      : HOURS_OF_DAY.filter((hour) => hour > Number(value.startHour));

  const toggleDay = (day: (typeof WEEK_DAYS)[number]) =>
    onChange({
      ...value,
      // Rebuilt from WEEK_DAYS rather than pushed onto, so the stored days are
      // always in week order and read that way everywhere downstream.
      days: WEEK_DAYS.filter((candidate) =>
        candidate === day ? !selected.has(day) : selected.has(candidate),
      ),
    });

  return (
    <div className="flex flex-col gap-2.5">
      <div
        role="group"
        aria-label="Days of the week"
        className="inline-flex flex-wrap gap-0.5 self-start rounded-sm border border-line bg-surface-sunken p-0.5"
      >
        {WEEK_DAYS.map((day) => {
          const active = selected.has(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              onClick={() => toggleDay(day)}
              className={cn(
                "inline-flex h-7 items-center rounded-xs px-3 text-[12.5px] font-semibold transition-colors",
                active
                  ? "bg-surface text-ink shadow-e1"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {WEEK_DAY_LABELS[day]}
            </button>
          );
        })}
      </div>
      <div className="flex max-w-sm items-center gap-2">
        <HourSelect
          id="daysAndHours"
          ariaLabel="Start time"
          placeholder="Start"
          value={value.startHour}
          hours={HOURS_OF_DAY}
          // A start at or past the current end would spell a backwards day, so
          // the end is dropped rather than left as a pair nothing can save.
          onChange={(startHour) =>
            onChange({
              ...value,
              startHour,
              endHour:
                value.endHour !== "" &&
                Number(value.endHour) <= Number(startHour)
                  ? ""
                  : value.endHour,
            })
          }
        />
        <span className="shrink-0 text-ink-faint">–</span>
        <HourSelect
          ariaLabel="End time"
          placeholder="End"
          value={value.endHour}
          hours={endHours}
          onChange={(endHour) => onChange({ ...value, endHour })}
        />
      </div>
    </div>
  );
}
