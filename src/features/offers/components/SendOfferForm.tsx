"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import { isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { majorInputToMinor } from "@/shared/utils/money";
import { useCreateOffer, useOffers } from "../hooks/useOffers";
import { sendOfferFormSchema, type SendOfferFormValues } from "../schemas";

export interface SendOfferFormProps {
  candidateId: string;
}

// At most one offer may be `sent` (awaiting a response) per candidate at a
// time — the same invariant the backend's create endpoint enforces with a
// 409, and the same shape as `ScheduleInterviewAction`'s open-interview check.
const LIVE_OFFER_STATUS = "sent";

/** 409 (a live offer already exists) and 404 (candidate on another
 * submission) are both reachable in normal use even with the entry point
 * pre-disabled — a second tab, a stale list — so each gets a specific inline
 * message instead of the mutation's raw error. */
function sendOfferErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not send this offer. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Conflict:
      return "This candidate already has an offer awaiting a response.";
    case HttpStatusCode.NotFound:
      return "This candidate could not be found on this submission.";
    default:
      return error.message;
  }
}

const EMPTY_VALUES: SendOfferFormValues = {
  salary: "",
  jobTitle: "",
  startDate: "",
  notes: "",
};

/**
 * The company's entry point for the first offer on a candidate, alongside
 * `ScheduleInterviewAction` in `CandidateCard` — offering belongs with the
 * other decisions a company makes about a candidate. Detects an already-open
 * offer by reading this candidate's own offer list (there is no dedicated
 * "has a live offer" endpoint, the same reasoning `ScheduleInterviewAction`
 * documents for interviews) and disables itself with a readable reason
 * instead of letting the create endpoint's 409 surface raw.
 *
 * Only ever creates the first offer — every counter after that happens from
 * `OfferCard` in the thread, which already knows which offer it supersedes.
 */
export function SendOfferForm({ candidateId }: SendOfferFormProps) {
  const disabledReasonId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const { data: offers, isPending: offersPending } = useOffers({
    candidateId,
    limit: 50,
  });
  const createOffer = useCreateOffer();

  const liveOffer = offers?.data.find(
    (offer) => offer.status === LIVE_OFFER_STATUS,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendOfferFormValues>({
    resolver: zodResolver(sendOfferFormSchema),
    defaultValues: EMPTY_VALUES,
  });

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
        jobTitle: values.jobTitle.trim() || undefined,
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
        className="flex flex-col gap-2.5 rounded-lg border border-border/60 p-3"
      >
        <p className="text-sm font-medium text-foreground">Send offer</p>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <Label htmlFor="send-offer-salary">Salary (USD/yr)</Label>
            <Input
              id="send-offer-salary"
              inputMode="decimal"
              {...register("salary")}
            />
            {errors.salary && (
              <p className="text-xs text-destructive">
                {errors.salary.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="send-offer-title">Title</Label>
            <Input id="send-offer-title" {...register("jobTitle")} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="send-offer-start-date">Start date</Label>
          <Input
            id="send-offer-start-date"
            type="date"
            {...register("startDate")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="send-offer-notes">Notes</Label>
          <Textarea id="send-offer-notes" {...register("notes")} />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={createOffer.isPending}>
            {createOffer.isPending ? "Sending…" : "Send offer"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={closeForm}>
            Cancel
          </Button>
        </div>
        {createOffer.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {sendOfferErrorMessage(createOffer.error)}
          </div>
        )}
      </form>
    );
  }

  const disabledReason = liveOffer
    ? "This candidate already has an offer awaiting a response."
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={Boolean(disabledReason) || offersPending}
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
