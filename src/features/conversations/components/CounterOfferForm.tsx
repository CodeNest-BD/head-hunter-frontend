"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Imported from the schemas module directly, not the offers barrel: the barrel
// also re-exports the feature's hooks, which would drag its API client into a
// component that only needs the validation rules.
import {
  offerTermsFormSchema,
  type OfferTermsFormValues,
} from "@/features/offers/schemas";
import { Button } from "@/shared/ui-components/controls/button";
import { DayPickerField } from "@/shared/ui-components/controls/DayPickerField";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor } from "@/shared/utils/money";

/** What the counter actually sends. The commission is never part of it — the
 * API copies that from the offer being countered. */
export interface CounterOfferTerms {
  salaryMinor: number;
  startDate?: string;
  notes?: string;
}

export interface CounterOfferFormProps {
  onSubmit: (terms: CounterOfferTerms) => void;
  onCancel: () => void;
  isPending: boolean;
}

const EMPTY_VALUES: OfferTermsFormValues = {
  salary: "",
  startDate: "",
  notes: "",
};

/**
 * The counter-offer's terms, inside `OfferCard`. Deliberately the same
 * treatment as `SendOfferForm`: the same `offerTermsFormSchema` bounds (a
 * salary above 0 and under the platform ceiling, a start date no earlier than
 * today) behind the same calendar field, because it is the same money field in
 * the same negotiation — and the number most likely to be typed in a hurry.
 *
 * Owns only the form. Sending, and reporting what the API said about it, stay
 * with `OfferCard`, which shows one error region for every offer action.
 */
export function CounterOfferForm({
  onSubmit,
  onCancel,
  isPending,
}: CounterOfferFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfferTermsFormValues>({
    resolver: zodResolver(offerTermsFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  const startDate = watch("startDate");

  const submit = handleSubmit((values) => {
    const salaryMinor = majorInputToMinor(values.salary);
    if (salaryMinor === null) return;
    onSubmit({
      salaryMinor,
      startDate: values.startDate.trim() || undefined,
      notes: values.notes.trim() || undefined,
    });
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <Label htmlFor="offer-counter-salary">New salary (USD/yr)</Label>
        <Input
          id="offer-counter-salary"
          inputMode="decimal"
          {...register("salary")}
        />
        {errors.salary && (
          <p className="text-xs text-destructive">{errors.salary.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="offer-counter-start-date">Start date</Label>
        <DayPickerField
          id="offer-counter-start-date"
          value={startDate}
          onChange={(day) =>
            setValue("startDate", day, { shouldValidate: true })
          }
          placeholder="Pick a start date"
          ariaLabel="Start date"
        />
        {errors.startDate && (
          <p className="text-xs text-destructive">{errors.startDate.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="offer-counter-notes">Notes</Label>
        <Textarea id="offer-counter-notes" {...register("notes")} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Sending…" : "Send counter"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
