"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import {
  offerTermsFormSchema,
  useCreateOffer,
  useWithdrawOffer,
  withdrawOfferErrorMessage,
  type Offer,
  type OfferStatus,
  type OfferTermsFormValues,
} from "@/features/offers";
import {
  isInterviewOpen,
  isOfferLive,
  type CandidateNegotiationState,
  type OpenInterviewBadge,
} from "@/features/conversations/utils/candidateNegotiationState";
import { firstStartDayAfterInterview } from "@/features/interviews/utils/slotTiming";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
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

/** "Awaiting a response" and "already hired" are different situations to the
 * person reading them, so each gets its own copy rather than one generic
 * "already has a live offer" message. */
function liveOfferDisabledReason(status: OfferStatus): string {
  return status === "accepted"
    ? "This candidate has already been hired."
    : "This candidate already has an offer awaiting a response.";
}

/**
 * Whether this rail may withdraw the live offer. Mirrors `OfferCard`'s
 * `creatorCanWithdraw`: only a `sent` offer, and only by the party that sent
 * it. `CandidateCard` is company-only, so a recruiter counter-offer — which
 * is `sent` and created by the recruiter — is deliberately not withdrawable
 * from here.
 */
function isWithdrawableByCompany(offer: Offer | null): offer is Offer {
  return offer?.status === "sent" && offer.createdBy === "company";
}

/** "Awaiting a time" and "scheduled" are different situations to the person
 * reading them — one round has yet to be pinned down, the other has yet to be
 * closed out — so each says what is actually outstanding. */
function openInterviewDisabledReason(kind: OpenInterviewBadge["kind"]): string {
  return kind === "scheduled"
    ? "This candidate has an interview scheduled — record its outcome first."
    : "This candidate has an interview awaiting a time — finish the round first.";
}

/**
 * Why offering is closed right now, or `null` while it is open. A live offer
 * outranks an open interview: it is the more specific fact about the very
 * offer this button would create.
 */
function offerDisabledReason(
  negotiationState: CandidateNegotiationState | null,
): string | null {
  const offerBadge = negotiationState?.offer ?? null;
  if (isOfferLive(offerBadge)) {
    return liveOfferDisabledReason(offerBadge.kind);
  }
  const interviewBadge = negotiationState?.interview ?? null;
  // Recording "Ready for offer" on the open round is the step that leads here.
  if (isInterviewOpen(interviewBadge)) {
    return openInterviewDisabledReason(interviewBadge.kind);
  }
  return null;
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
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const createOffer = useCreateOffer();

  const liveOffer = negotiationState?.offerRecord ?? null;
  const withdrawableOffer = isWithdrawableByCompany(liveOffer)
    ? liveOffer
    : null;
  // Hooks cannot be conditional, so this is mounted with an empty id when
  // there is nothing to withdraw — the button that would fire it is not
  // rendered in that case.
  const withdrawOffer = useWithdrawOffer(withdrawableOffer?.id ?? "");

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
  const earliestStartDay = firstStartDayAfterInterview(
    negotiationState?.interviewRecord ?? null,
  );

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
          <NumericInput id="send-offer-salary" {...register("salary")} />
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
            minDay={earliestStartDay}
          />
          {errors.startDate && (
            <p className="text-xs text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="send-offer-notes">
            Notes
            <span className="ml-1 font-normal text-muted-foreground">
              Optional
            </span>
          </Label>
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

  const disabledReason = offerDisabledReason(negotiationState);

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
      {withdrawableOffer &&
        (isWithdrawing ? (
          <ConfirmAction
            message="Withdraw this offer? The candidate will go back to their previous status."
            confirmLabel="Confirm withdraw"
            busyLabel="Withdrawing…"
            busy={withdrawOffer.isPending}
            onCancel={() => setIsWithdrawing(false)}
            // Closes itself rather than waiting to be unmounted once the
            // offers query refetches: until then the panel would sit there
            // re-enabled, inviting a second withdraw that can only 409.
            onConfirm={() =>
              withdrawOffer.mutate(undefined, {
                onSuccess: () => setIsWithdrawing(false),
              })
            }
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setIsWithdrawing(true)}
          >
            Withdraw
          </Button>
        ))}
      {withdrawOffer.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {withdrawOfferErrorMessage(withdrawOffer.error)}
        </div>
      )}
    </div>
  );
}
