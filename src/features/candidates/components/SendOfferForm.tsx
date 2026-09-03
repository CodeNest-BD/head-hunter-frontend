"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import {
  offerTermsFormSchema,
  useCreateOffer,
  type OfferStatus,
  type OfferTermsFormValues,
} from "@/features/offers";
import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { DayPickerField } from "@/shared/ui-components/controls/DayPickerField";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor } from "@/shared/utils/money";

export interface SendOfferFormProps {
  candidateId: string;
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet — derived once
   * per page from the page-level `useOffers({ candidateId })` query, never
   * fetched per candidate here. */
  negotiationState: CandidateNegotiationState | null;
}

// At most one offer may be `sent` (awaiting a response) or `accepted` (the
// candidate has already been hired) per candidate at a time — the same
// invariant the backend's create endpoint enforces with a 409, distinguishing
// the same two cases, and the same shape as `ScheduleInterviewAction`'s
// open-interview check.
const LIVE_OFFER_STATUSES = new Set<OfferStatus>(["sent", "accepted"]);

/** "Awaiting a response" and "already hired" are different situations to the
 * person reading them, so each gets its own copy rather than one generic
 * "already has a live offer" message. */
function liveOfferDisabledReason(status: OfferStatus): string {
  return status === "accepted"
    ? "This candidate has already been hired."
    : "This candidate already has an offer awaiting a response.";
}

/** 409 (a live offer already exists) and 404 (candidate on another
 * submission) are both reachable in normal use even with the entry point
 * pre-disabled — a second tab, a stale list — so each gets a specific inline
 * message instead of the mutation's raw error. The 409 case reuses the
 * backend's own message: it already distinguishes "awaiting a response"
 * from "already been hired", the same way `liveOfferDisabledReason` does. */
function sendOfferErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not send this offer. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.NotFound:
      return "This candidate could not be found on this submission.";
    default:
      return allMessages(error);
  }
}

const EMPTY_VALUES: OfferTermsFormValues = {
  salary: "",
  startDate: "",
  notes: "",
};

/**
 * The company's entry point for the first offer on a candidate, alongside
 * `ScheduleInterviewAction` in `CandidateCard` — offering belongs with the
 * other decisions a company makes about a candidate. Detects an already-live
 * offer from the `negotiationState` its parent already derived from the
 * page-level offers query (there is no dedicated "has a live offer" endpoint,
 * the same reasoning `ScheduleInterviewAction` documents for interviews) and
 * disables itself with a readable reason instead of letting the create
 * endpoint's 409 surface raw.
 *
 * Only ever creates the first offer — every counter after that happens from
 * `OfferCard` in the thread, which already knows which offer it supersedes.
 */
export function SendOfferForm({
  candidateId,
  negotiationState,
}: SendOfferFormProps) {
  const disabledReasonId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const createOffer = useCreateOffer();

  const offerBadge = negotiationState?.offer ?? null;
  const liveOffer =
    offerBadge && LIVE_OFFER_STATUSES.has(offerBadge.kind) ? offerBadge : null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfferTermsFormValues>({
    resolver: zodResolver(offerTermsFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  const startDate = watch("startDate");

  const closeForm = (): void => {
    setIsOpen(false);
    reset(EMPTY_VALUES);
  };

  const onSubmit = handleSubmit((values) => {
    const salaryMinor = majorInputToMinor(values.salary);
    if (salaryMinor === null) return;
    createOffer.mutate(
      {
        candidateId,
        salaryMinor,
        startDate: values.startDate.trim() || undefined,
        notes: values.notes.trim() || undefined,
      },
      { onSuccess: closeForm },
    );
  });

  if (isOpen) {
    return (
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2.5 rounded-md border border-border/60 p-3"
      >
        <p className="text-sm font-medium text-foreground">Send offer</p>
        <div className="flex flex-col gap-1">
          <Label htmlFor="send-offer-salary">Salary (USD/yr)</Label>
          <NumericInput
            decimal
            id="send-offer-salary"
            {...register("salary")}
          />
          {errors.salary && (
            <p className="text-xs text-destructive">{errors.salary.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="send-offer-start-date">Start date</Label>
          <DayPickerField
            id="send-offer-start-date"
            value={startDate}
            onChange={(day) =>
              setValue("startDate", day, { shouldValidate: true })
            }
            placeholder="Pick a start date"
            ariaLabel="Start date"
          />
          {errors.startDate && (
            <p className="text-xs text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="send-offer-notes">Notes</Label>
          <Textarea id="send-offer-notes" {...register("notes")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={createOffer.isPending}>
            {createOffer.isPending ? "Sending…" : "Send offer"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={closeForm}>
            Cancel
          </Button>
        </div>
        {createOffer.isError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {sendOfferErrorMessage(createOffer.error)}
          </div>
        )}
      </form>
    );
  }

  const disabledReason = liveOffer
    ? liveOfferDisabledReason(liveOffer.kind)
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={Boolean(disabledReason)}
        aria-describedby={disabledReason ? disabledReasonId : undefined}
        onClick={() => setIsOpen(true)}
      >
        Send offer
      </Button>
      {disabledReason && (
        <p id={disabledReasonId} className="text-xs text-muted-foreground">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
