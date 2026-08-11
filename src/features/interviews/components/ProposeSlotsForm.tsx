"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HttpStatusCode } from "axios";
import { AlertCircle, X } from "lucide-react";

import { isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { useProposeSlots } from "../hooks/useInterviews";
import {
  MAX_PROPOSAL_SLOTS,
  proposeSlotsFormSchema,
  type ProposeSlotsFormValues,
} from "../schemas";

export interface ProposeSlotsFormProps {
  interviewId: string;
  /** Called once the batch is proposed successfully — the caller decides what
   * "done" means (close the panel, collapse back into the thread, etc.). */
  onDone: () => void;
}

const EMPTY_SLOT = { startAt: "", endAt: "" };

/**
 * 403 (a recruiter calling this company-only endpoint) and 409 (the interview
 * is no longer awaiting a time) are both reachable in normal use, so each
 * gets a specific inline message — the same rationale as
 * `MessageComposer`'s send errors.
 */
function proposeSlotsErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not propose these times. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Forbidden:
      return "Only the company can propose interview times.";
    case HttpStatusCode.Conflict:
      return "This interview is no longer awaiting a time.";
    default:
      return error.message;
  }
}

/** 1-5 candidate windows for one interview. Used both by the company's
 * scheduling entry point (the first batch) and `ProposalCard`'s "Propose new
 * times" (every batch after). */
export function ProposeSlotsForm({ interviewId, onDone }: ProposeSlotsFormProps) {
  const proposeSlots = useProposeSlots(interviewId);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposeSlotsFormValues>({
    resolver: zodResolver(proposeSlotsFormSchema),
    defaultValues: { slots: [EMPTY_SLOT] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "slots" });

  const onSubmit = handleSubmit((values) => {
    proposeSlots.mutate(
      {
        slots: values.slots.map((slot) => ({
          startAt: new Date(slot.startAt).toISOString(),
          endAt: new Date(slot.endAt).toISOString(),
        })),
      },
      { onSuccess: onDone },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-2 rounded-lg border border-border/60 p-3"
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
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`slots.${index}.startAt`}>Start</Label>
              <Input
                id={`slots.${index}.startAt`}
                type="datetime-local"
                {...register(`slots.${index}.startAt`)}
              />
              {errors.slots?.[index]?.startAt && (
                <p className="text-xs text-destructive">
                  {errors.slots[index]?.startAt?.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`slots.${index}.endAt`}>End</Label>
              <Input
                id={`slots.${index}.endAt`}
                type="datetime-local"
                {...register(`slots.${index}.endAt`)}
              />
              {errors.slots?.[index]?.endAt && (
                <p className="text-xs text-destructive">
                  {errors.slots[index]?.endAt?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

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

      <Button
        type="submit"
        size="sm"
        className="self-start"
        disabled={proposeSlots.isPending}
      >
        {proposeSlots.isPending ? "Proposing…" : "Propose times"}
      </Button>

      {proposeSlots.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {proposeSlotsErrorMessage(proposeSlots.error)}
        </div>
      )}
    </form>
  );
}
