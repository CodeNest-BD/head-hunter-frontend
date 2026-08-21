"use client";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Popover from "@radix-ui/react-popover";
import { format, startOfToday } from "date-fns";
import { AlertCircle, CalendarIcon, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { Calendar } from "@/shared/ui-components/controls/calendar";
import { Label } from "@/shared/ui-components/controls/label";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { useProposeSlots } from "../hooks/useInterviews";
import {
  MAX_PROPOSAL_SLOTS,
  proposeSlotsFormSchema,
  SLOT_DURATION_OPTIONS,
  type ProposeSlotFormValues,
  type ProposeSlotsFormValues,
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

const EMPTY_SLOT: ProposeSlotFormValues = {
  day: "",
  startTime: "09:00",
  durationMinutes: 60,
};

/** A day string round-trips through the calendar as a local `Date`; an empty
 * (not-yet-picked) day has no date to select. */
function toSelectedDate(day: string): Date | undefined {
  return day ? new Date(`${day}T00:00`) : undefined;
}

function isCompleteSlot(slot: ProposeSlotFormValues): boolean {
  return Boolean(slot.day && slot.startTime);
}

/** 1-5 candidate windows for one interview. Used both by the company's
 * scheduling entry point (the first batch) and `ProposalCard`'s "Propose new
 * times" (every batch after). */
export function ProposeSlotsForm({
  interviewId,
  onDone,
  onCancel,
}: ProposeSlotsFormProps) {
  const proposeSlots = useProposeSlots(interviewId);
  const {
    control,
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposeSlotsFormValues>({
    resolver: zodResolver(proposeSlotsFormSchema),
    defaultValues: { slots: [EMPTY_SLOT] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "slots" });
  const slots = watch("slots");
  // Past days are off the calendar, but "today at 9am" can still be in the
  // past — the server owns that rule, so this only stops the obvious half.
  const firstSelectableDay = startOfToday();

  const onSubmit = handleSubmit((values) => {
    proposeSlots.mutate(
      { slots: values.slots.map(toSlotRange) },
      {
        onSuccess: onDone,
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {fields.map((field, index) => {
        const slot = slots?.[index];
        const slotErrors = errors.slots?.[index];
        return (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-md border border-border/60 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Time {index + 1}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`slots.${index}.day`}>Day</Label>
                <Controller
                  control={control}
                  name={`slots.${index}.day`}
                  render={({ field: dayField }) => {
                    const selected = toSelectedDate(dayField.value);
                    return (
                      // The calendar lives in a popover rather than inline: a
                      // permanently rendered month grid dominated the card and
                      // pushed the actions below the fold.
                      <Popover.Root>
                        <Popover.Trigger asChild>
                          <button
                            type="button"
                            id={`slots.${index}.day`}
                            className="flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <span
                              className={
                                selected
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {selected
                                ? format(selected, "EEE, d MMM yyyy")
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
                              selected={selected}
                              defaultMonth={selected ?? firstSelectableDay}
                              disabled={{ before: firstSelectableDay }}
                              onSelect={(date) =>
                                dayField.onChange(
                                  date ? format(date, DAY_FORMAT) : "",
                                )
                              }
                              aria-label={`Day for time ${index + 1}`}
                            />
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    );
                  }}
                />
                {slotErrors?.day && (
                  <p className="text-xs text-destructive">
                    {slotErrors.day.message}
                  </p>
                )}
              </div>

              <>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`slots.${index}.startTime`}>Start</Label>
                  <NativeSelect
                    id={`slots.${index}.startTime`}
                    {...register(`slots.${index}.startTime`)}
                  >
                    {SLOT_TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                  {slotErrors?.startTime && (
                    <p className="text-xs text-destructive">
                      {slotErrors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor={`slots.${index}.durationMinutes`}>
                    Length
                  </Label>
                  <NativeSelect
                    id={`slots.${index}.durationMinutes`}
                    {...register(`slots.${index}.durationMinutes`, {
                      valueAsNumber: true,
                    })}
                  >
                    {SLOT_DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} min
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </>
            </div>

            {slot && isCompleteSlot(slot) && (
              <p className="text-xs font-medium text-foreground">
                {formatSlotWindow(slot)}
              </p>
            )}
          </div>
        );
      })}

      {errors.slots?.message && (
        <p className="text-xs text-destructive">{errors.slots.message}</p>
      )}

      {fields.length < MAX_PROPOSAL_SLOTS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start border-dashed"
          onClick={() => append(EMPTY_SLOT)}
        >
          + Add another time
        </Button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={proposeSlots.isPending}>
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
