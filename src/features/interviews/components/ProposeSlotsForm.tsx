"use client";

import { useId, useState } from "react";
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
 * Why the picker cannot add right now, or that it can. A union rather than the
 * four booleans it replaces: the reasons are mutually exclusive to the person
 * reading them, so exactly one is ever shown and `canAdd` has one definition
 * instead of being re-derived beside every hint.
 */
type AddState =
  | { kind: "ready" }
  | { kind: "needsDay"; hint: string }
  | { kind: "noTimesToday"; hint: string }
  | { kind: "duplicate"; hint: string }
  | { kind: "full"; hint: string };

/**
 * 1-5 candidate windows for one interview. Used by the company's scheduling
 * entry point and by `ProposalCard`'s "Propose new times".
 *
 * Reads top-down as "here is what I am sending, here is how I add to it": the
 * staged list sits above the day/start-time/length row that appends to it, and
 * keeps an empty state — an empty list used to render as nothing at all, which
 * is what hid the add-then-remove model from first-time users. Length applies
 * to the whole batch. Every entry still becomes one `{startAt, endAt}` pair,
 * so the API contract is unchanged.
 */
export function ProposeSlotsForm({
  interviewId,
  onDone,
  onCancel,
}: ProposeSlotsFormProps) {
  const stagedHeadingId = useId();
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

  const isAlreadyStaged = fields.some(
    (field) => field.day === day && field.startTime === effectiveStartTime,
  );

  const addState: AddState = ((): AddState => {
    if (day === "") {
      return { kind: "needsDay", hint: "Choose a day first" };
    }
    // No selectable time left means the chosen day is today and the rest of it
    // has already passed.
    if (effectiveStartTime === "") {
      return {
        kind: "noTimesToday",
        hint: "No times left today — pick another day.",
      };
    }
    if (isAlreadyStaged) {
      return { kind: "duplicate", hint: "That time is already offered" };
    }
    if (fields.length >= MAX_PROPOSAL_SLOTS) {
      return { kind: "full", hint: "Remove one to offer a different time" };
    }
    return { kind: "ready" };
  })();

  const canAdd = addState.kind === "ready";

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

  // The select hands back a string; the length is looked up in the closed set
  // of options rather than cast, so a value outside it changes nothing.
  const chooseDuration = (value: string): void => {
    const minutes = SLOT_DURATION_OPTIONS.find(
      (option) => String(option) === value,
    );
    if (minutes !== undefined) {
      changeDuration(minutes);
    }
  };

  const onSubmit = handleSubmit((values) => {
    proposeSlots.mutate(
      { slots: values.slots.map(toSlotRange) },
      { onSuccess: onDone },
    );
  });

  const canSubmit =
    fields.length > 0 || (day !== "" && effectiveStartTime !== "");
  // An array-level issue (too few, too many) lands on the array's own
  // `message`. react-hook-form 7.53 populates `errors.slots.root` only for a
  // field-array error set by hand through `setError`, which nothing here does,
  // so the resolver's message is the only one there is to read.
  const slotsErrorMessage = errors.slots?.message;

  return (
    <form
      // A picked day + time is a complete one-slot proposal on its own — the
      // backend accepts 1-5 slots, so "Add to proposal" is an explicit
      // add-another affordance, not a precondition. Staging the current pick
      // through the same `addTime` the button uses, before `onSubmit` (and the
      // schema validation inside it) runs, means a user who never clicked
      // "Add to proposal" still submits what they chose instead of hitting
      // "Propose at least 1 time" — while `canAdd` keeps a sixth slot from
      // ever being appended past the schema's max, which no amount of error
      // copy could recover from. Never re-inline these guards here: a second
      // copy is what let the form dead-end at 6 slots.
      onSubmit={(event) => {
        addTime();
        void onSubmit(event);
      }}
      className="flex flex-col gap-4"
    >
      {/* The batch being assembled comes first, so it reads as the thing being
          built rather than as output of the picker below it. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p
            id={stagedHeadingId}
            className="text-sm font-medium text-foreground"
          >
            Times you&apos;ll propose
          </p>
          <span className="tabular-nums text-xs text-muted-foreground">
            {fields.length} of {MAX_PROPOSAL_SLOTS} times added
          </span>
        </div>

        {fields.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
            No times added yet — pick a day and time below.
          </p>
        ) : (
          // `role="list"` survives the list-style reset, which otherwise drops
          // list semantics in Safari/VoiceOver.
          <ul
            role="list"
            aria-labelledby={stagedHeadingId}
            className="flex flex-col gap-1.5"
          >
            {fields.map((field, index) => {
              const slotWindow = formatSlotWindow(field);
              return (
                <li
                  key={field.id}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-background/50 py-1.5 pl-3 pr-1.5 text-sm"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {slotWindow}
                  </span>
                  {/* The word carries the meaning — the bare glyph did not read
                      as "removable". The accessible name adds the window, so
                      the buttons are told apart out of context. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${slotWindow}`}
                    onClick={() => remove(index)}
                    className="h-7 shrink-0 gap-1 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Day, start time and length on one line: three short controls that are
          always chosen together, and stacking them pushed the actions below the
          fold. Length applies to the whole batch, so it is re-stamped onto
          anything already added. */}
      <div className="flex flex-col gap-1.5">
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
              disabled={addState.kind === "noTimesToday"}
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
              onChange={(event) => chooseDuration(event.target.value)}
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
            Add to proposal
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {addState.kind !== "ready" && <span>{addState.hint}</span>}
          {/* Says out loud that the button is a convenience: the submit already
              includes whatever is picked here. Users reading the old
              "+ Add time" took the click for a precondition. */}
          <span>
            Adding is optional — the time picked here is included when you
            propose.
          </span>
        </div>
      </div>

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
