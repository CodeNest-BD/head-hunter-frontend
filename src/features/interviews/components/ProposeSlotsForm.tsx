"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Popover from "@radix-ui/react-popover";
import { format, startOfToday } from "date-fns";
import { AlertCircle, CalendarIcon, Check, Plus, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { Calendar } from "@/shared/ui-components/controls/calendar";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
import { Label } from "@/shared/ui-components/controls/label";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { useProposeSlots } from "../hooks/useInterviews";
import {
  MAX_PROPOSAL_SLOTS,
  proposeSlotsFormSchema,
  SLOT_DURATION_OPTIONS,
  type ProposeSlotsFormValues,
  type SlotDurationMinutes,
} from "../schemas";
import { proposeSlotsErrorMessage } from "../utils/interviewErrorMessages";
import {
  formatSlotWindow,
  SLOT_TIME_OPTIONS,
  toSlotRange,
} from "../utils/slotTiming";

export interface ProposeSlotsFormProps {
  interviewId: string;
  /** Called once the batch is proposed successfully — the caller decides what
   * "done" means (close the panel, collapse back into the thread, etc.). */
  onDone: () => void;
  /** Renders a Cancel beside the submit when provided, so the two actions share
   * a row instead of the caller stacking its own button underneath. */
  onCancel?: () => void;
}

const DAY_FORMAT = "yyyy-MM-dd";
const DEFAULT_DURATION: SlotDurationMinutes = 60;

/** A day string round-trips through the calendar as a local `Date`; an empty
 * (not-yet-picked) day has no date to select. */
function toSelectedDate(day: string): Date | undefined {
  return day ? new Date(`${day}T00:00`) : undefined;
}

/**
 * 1-5 candidate windows for one interview. Used both by the company's
 * scheduling entry point (the first batch) and `ProposalCard`'s "Propose new
 * times" (every batch after).
 *
 * Shaped around how the job is actually done: pick the length once for the
 * batch, then a day, then as many start times on that day as wanted — moving to
 * another day keeps everything already chosen. The previous form repeated a
 * day/start/length trio per slot, so proposing five times meant re-picking the
 * same length five times and rendering five month grids.
 *
 * The submitted shape is unchanged: each selection still becomes one
 * `{startAt, endAt}` pair, so the schema and API contract are untouched.
 */
export function ProposeSlotsForm({
  interviewId,
  onDone,
  onCancel,
}: ProposeSlotsFormProps) {
  const proposeSlots = useProposeSlots(interviewId);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposeSlotsFormValues>({
    resolver: zodResolver(proposeSlotsFormSchema),
    defaultValues: { slots: [] },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "slots",
  });

  // Past days are off the calendar, but "today at 9am" can still be in the
  // past — the server owns that rule, so this only stops the obvious half.
  const firstSelectableDay = startOfToday();
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] =
    useState<SlotDurationMinutes>(DEFAULT_DURATION);

  const selectedDate = toSelectedDate(day);
  const atMax = fields.length >= MAX_PROPOSAL_SLOTS;

  const indexOfSlot = (startTime: string): number =>
    fields.findIndex(
      (field) => field.day === day && field.startTime === startTime,
    );

  const alreadyOffered = indexOfSlot(startTime) >= 0;
  const canAdd = day !== "" && !atMax && !alreadyOffered;

  const addTime = (): void => {
    if (!canAdd) {
      return;
    }
    append({ day, startTime, durationMinutes: duration });
  };

  // Length belongs to the batch, so changing it re-stamps what is already
  // chosen rather than leaving a mix of lengths nobody asked for.
  const changeDuration = (minutes: SlotDurationMinutes): void => {
    setDuration(minutes);
    replace(fields.map((field) => ({ ...field, durationMinutes: minutes })));
  };

  const onSubmit = handleSubmit((values) => {
    proposeSlots.mutate(
      { slots: values.slots.map(toSlotRange) },
      { onSuccess: onDone },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>How long is each interview?</Label>
        <div className="flex flex-wrap gap-2">
          {SLOT_DURATION_OPTIONS.map((minutes) => (
            <FilterChip
              key={minutes}
              active={duration === minutes}
              onClick={() => changeDuration(minutes)}
              className="px-3 py-1.5 text-xs"
            >
              {minutes} min
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="propose-day">Which day?</Label>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              id="propose-day"
              className="flex h-9 w-full max-w-xs items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span
                className={
                  selectedDate ? "text-foreground" : "text-muted-foreground"
                }
              >
                {selectedDate
                  ? format(selectedDate, "EEE, d MMM yyyy")
                  : "Pick a day"}
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
                onSelect={(date) =>
                  setDay(date ? format(date, DAY_FORMAT) : "")
                }
                aria-label="Day to offer times on"
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* A dropdown rather than a grid of every quarter-hour: the day already
          narrows the choice, and 96 chips made the form scroll. Multiple times
          are still supported — each pick is added to the list below. */}
      {day && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Label htmlFor="propose-start-time">
              Start time on {selectedDate && format(selectedDate, "EEE, d MMM")}
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {fields.length} of {MAX_PROPOSAL_SLOTS} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              id="propose-start-time"
              className="w-auto"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            >
              {SLOT_TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdd}
              onClick={addTime}
            >
              <Plus className="h-4 w-4" />
              Add time
            </Button>
            {alreadyOffered && (
              <span className="text-xs text-muted-foreground">
                Already offered
              </span>
            )}
            {atMax && !alreadyOffered && (
              <span className="text-xs text-muted-foreground">
                Remove one to offer a different time
              </span>
            )}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Offering</Label>
          <ul className="flex flex-col gap-1.5">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm"
              >
                <Check
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {formatSlotWindow(field)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${formatSlotWindow(field)}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.slots?.message && (
        <p className="text-xs text-destructive">{errors.slots.message}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={proposeSlots.isPending || fields.length === 0}
        >
          {proposeSlots.isPending ? "Proposing…" : "Propose times"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {proposeSlots.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {proposeSlotsErrorMessage(proposeSlots.error)}
        </div>
      )}
    </form>
  );
}
