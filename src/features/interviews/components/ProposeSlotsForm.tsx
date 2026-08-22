"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Plus, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { DayPickerField } from "@/shared/ui-components/controls/DayPickerField";
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
  selectableTimeOptions,
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

const DEFAULT_DURATION: SlotDurationMinutes = 60;

/**
 * 1-5 candidate windows for one interview. Used by the company's scheduling
 * entry point and by `ProposalCard`'s "Propose new times".
 *
 * Day, start time and length sit on one row; each Add appends to the list below,
 * and length applies to the whole batch. Every selection still becomes one
 * `{startAt, endAt}` pair, so the API contract is unchanged.
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

  // `DayPickerField` keeps past days off the calendar, but "today at 9am" can
  // still be in the past — `selectableTimeOptions` below handles that half.
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] =
    useState<SlotDurationMinutes>(DEFAULT_DURATION);

  const atMax = fields.length >= MAX_PROPOSAL_SLOTS;

  // The whole-day list, narrowed to what is still ahead of now when `day` is
  // today. `startTime` can go stale once its day was today and that time
  // passed (or once no day is chosen and the day changes to today), so every
  // read of "the time actually selected" goes through `effectiveStartTime`
  // below rather than the raw state — a derivation instead of an effect that
  // resets `startTime` on every `day`/tick change.
  const timeOptions = selectableTimeOptions(day, new Date());
  const effectiveStartTime = timeOptions.some(
    (option) => option.value === startTime,
  )
    ? startTime
    : (timeOptions[0]?.value ?? "");
  const noTimesLeftToday = day !== "" && timeOptions.length === 0;

  const indexOfSlot = (time: string): number =>
    fields.findIndex((field) => field.day === day && field.startTime === time);

  const alreadyOffered = indexOfSlot(effectiveStartTime) >= 0;
  const canAdd =
    day !== "" && effectiveStartTime !== "" && !atMax && !alreadyOffered;

  const addTime = (): void => {
    if (!canAdd) {
      return;
    }
    append({ day, startTime: effectiveStartTime, durationMinutes: duration });
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

  const canSubmit =
    fields.length > 0 || (day !== "" && effectiveStartTime !== "");
  const slotsErrorMessage =
    errors.slots?.root?.message ?? errors.slots?.message;

  return (
    <form
      // A picked day + time is a complete one-slot proposal on its own — the
      // backend accepts 1-5 slots, so "Add time" is an explicit add-another
      // affordance, not a precondition. Staging the current pick through the
      // same `addTime` the button uses, before `onSubmit` (and the schema
      // validation inside it) runs, means a user who never clicked "Add time"
      // still submits what they chose instead of hitting "Propose at least 1
      // time" — while `canAdd` keeps a sixth slot from ever being appended
      // past the schema's max, which no amount of error copy could recover
      // from. Never re-inline these guards here: a second copy is what let
      // the form dead-end at 6 slots.
      onSubmit={(event) => {
        addTime();
        void onSubmit(event);
      }}
      className="flex flex-col gap-4"
    >
      {/* Day, start time and length on one line: three short controls that are
          always chosen together, and stacking them pushed the actions below the
          fold. Length applies to the whole batch, so it is re-stamped onto
          anything already added. */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[11rem] flex-1 flex-col gap-1">
          <Label htmlFor="propose-day">Day</Label>
          <DayPickerField
            id="propose-day"
            value={day}
            onChange={setDay}
            placeholder="Pick a day"
            ariaLabel="Day to offer times on"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="propose-start-time">Start time</Label>
          <NativeSelect
            id="propose-start-time"
            className="w-auto"
            value={effectiveStartTime}
            disabled={noTimesLeftToday}
            onChange={(event) => setStartTime(event.target.value)}
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="propose-duration">Length</Label>
          <NativeSelect
            id="propose-duration"
            className="w-auto"
            value={String(duration)}
            onChange={(event) =>
              changeDuration(Number(event.target.value) as SlotDurationMinutes)
            }
          >
            {SLOT_DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </NativeSelect>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          disabled={!canAdd}
          onClick={addTime}
        >
          <Plus className="h-4 w-4" />
          Add time
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {fields.length} of {MAX_PROPOSAL_SLOTS} selected
        </span>
        {alreadyOffered && <span>That time is already offered</span>}
        {atMax && !alreadyOffered && (
          <span>Remove one to offer a different time</span>
        )}
        {!day && <span>Choose a day first</span>}
        {noTimesLeftToday && (
          <span>No times left today — pick another day.</span>
        )}
      </div>

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

      {/* An array-level issue (too few, too many) lands on `root`, not on the
          field itself — reading only `errors.slots.message` silently swallowed
          it and left the form looking inert. */}
      {slotsErrorMessage && (
        <p className="text-xs text-destructive">{slotsErrorMessage}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={proposeSlots.isPending || !canSubmit}
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
