"use client";

import { useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import {
  useAcceptOffer,
  useCounterOffer,
  useDeclineOffer,
  useWithdrawOffer,
} from "@/features/offers";
import { ReviewCta } from "@/features/reviews";
import { isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { formatDate } from "@/shared/utils/formatDate";
import { Money } from "@/shared/ui-components/data/MoneyVisibility";
import { formatMinor, majorInputToMinor } from "@/shared/utils/money";
import type { ConversationEvent } from "../schemas";

export type OfferEventData = Extract<
  NonNullable<ConversationEvent["data"]>,
  { kind: "offer" }
>;

export interface OfferCardProps {
  data: OfferEventData;
  viewerParty: "company" | "recruiter";
}

const OFFER_EVENT_STATUS_LABELS: Record<OfferEventData["offerStatus"], string> =
  {
    sent: "Awaiting response",
    accepted: "Accepted",
    declined: "Declined",
    countered: "Countered",
    superseded: "Superseded",
    unknown: "Status unknown",
  };

/**
 * 403 (wrong party, or trying to act on your own offer), 404 (an offer id
 * that no longer belongs to the caller) and 409 (the offer is no longer
 * `sent`) are all reachable in normal use — the same three
 * `acceptOffer`/`declineOffer`/`counterOffer`/`withdrawOffer` document — so
 * each gets a specific inline message instead of the mutation's raw error.
 */
function negotiationErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Something went wrong. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Forbidden:
      return "You cannot respond to your own offer.";
    case HttpStatusCode.NotFound:
      return "This offer is no longer available — refresh and try again.";
    case HttpStatusCode.Conflict:
      return "This offer is no longer awaiting a response.";
    default:
      return error.message;
  }
}

interface CounterFormValues {
  salary: string;
  jobTitle: string;
  startDate: string;
  notes: string;
}

const EMPTY_COUNTER_FORM: CounterFormValues = {
  salary: "",
  jobTitle: "",
  startDate: "",
  notes: "",
};

/**
 * The actionable offer entry in a job's conversation thread. State — which
 * actions are available — comes entirely from `data.offerStatus` compared
 * with `data.createdBy` and the viewer's own party; there is no local "was
 * this accepted" flag, so a mutation that fails leaves the card exactly
 * where the server says the offer actually is once the thread refetches.
 */
export function OfferCard({ data, viewerParty }: OfferCardProps) {
  const {
    offerId,
    offerStatus,
    amountMinor,
    salaryMinor,
    jobTitle,
    startDate,
    previousOfferId,
    createdBy,
  } = data;
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterForm, setCounterForm] =
    useState<CounterFormValues>(EMPTY_COUNTER_FORM);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const acceptOffer = useAcceptOffer(offerId);
  const declineOffer = useDeclineOffer(offerId);
  const counterOffer = useCounterOffer(offerId);
  const withdrawOffer = useWithdrawOffer(offerId);

  const isSent = offerStatus === "sent";
  const isCreator = viewerParty === createdBy;
  // The party who did not create the current offer is the one who gets to
  // respond to it — the creator already said their number.
  const counterpartyCanRespond = isSent && !isCreator;
  const creatorCanWithdraw = isSent && isCreator;

  const counterSalaryMinor = majorInputToMinor(counterForm.salary);

  const mutationError =
    acceptOffer.error ??
    declineOffer.error ??
    counterOffer.error ??
    withdrawOffer.error;
  const mutationIsError =
    acceptOffer.isError ||
    declineOffer.isError ||
    counterOffer.isError ||
    withdrawOffer.isError;

  const submitCounter = (): void => {
    if (counterSalaryMinor === null) return;
    counterOffer.mutate(
      {
        salaryMinor: counterSalaryMinor,
        jobTitle: counterForm.jobTitle.trim() || undefined,
        startDate: counterForm.startDate || undefined,
        notes: counterForm.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowCounterForm(false);
          setCounterForm(EMPTY_COUNTER_FORM);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-foreground">Offer</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {OFFER_EVENT_STATUS_LABELS[offerStatus]}
        </span>
      </div>

      {previousOfferId && (
        <p className="text-xs text-muted-foreground">
          Counters a previous offer.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Salary
        </span>
        <p className="text-lg font-semibold text-foreground">
          <Money minor={salaryMinor} />
        </p>
      </div>

      {(jobTitle ?? startDate) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {jobTitle && <span>Title: {jobTitle}</span>}
          {startDate && <span>Start date: {formatDate(startDate)}</span>}
        </div>
      )}

      {/* A hire (accepted offer) is what unlocks the company's review of the
          recruiter — one per hire, editable afterwards. */}
      {offerStatus === "accepted" && viewerParty === "company" && (
        <div className="border-t border-border/60 pt-3">
          <ReviewCta offerId={offerId} />
        </div>
      )}

      {/* The commission is fixed by the job's advertised fee and read-only —
          shown as plain text, never an input, and kept visually apart from
          the salary above so it can't be mistaken for part of what's being
          negotiated. */}
      <div className="flex items-baseline gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
        <span>Recruiter&apos;s fee (fixed, not part of this negotiation):</span>
        <span className="font-medium text-foreground">
          <Money minor={amountMinor} />
        </span>
      </div>

      {counterpartyCanRespond && !showCounterForm && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={acceptOffer.isPending}
            onClick={() => acceptOffer.mutate()}
          >
            {acceptOffer.isPending ? "Accepting…" : "Accept"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={declineOffer.isPending}
            onClick={() => declineOffer.mutate()}
          >
            {declineOffer.isPending ? "Declining…" : "Decline"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCounterForm(true)}
          >
            Counter
          </Button>
        </div>
      )}

      {counterpartyCanRespond && showCounterForm && (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <Label htmlFor="offer-counter-salary">New salary (USD/yr)</Label>
              <Input
                id="offer-counter-salary"
                inputMode="decimal"
                value={counterForm.salary}
                onChange={(event) =>
                  setCounterForm((form) => ({
                    ...form,
                    salary: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="offer-counter-title">Title</Label>
              <Input
                id="offer-counter-title"
                value={counterForm.jobTitle}
                onChange={(event) =>
                  setCounterForm((form) => ({
                    ...form,
                    jobTitle: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="offer-counter-start-date">Start date</Label>
            <Input
              id="offer-counter-start-date"
              type="date"
              value={counterForm.startDate}
              onChange={(event) =>
                setCounterForm((form) => ({
                  ...form,
                  startDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="offer-counter-notes">Notes</Label>
            <Textarea
              id="offer-counter-notes"
              value={counterForm.notes}
              onChange={(event) =>
                setCounterForm((form) => ({
                  ...form,
                  notes: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={counterSalaryMinor === null || counterOffer.isPending}
              onClick={submitCounter}
            >
              {counterOffer.isPending ? "Sending…" : "Send counter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCounterForm(false);
                setCounterForm(EMPTY_COUNTER_FORM);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {creatorCanWithdraw && !confirmingWithdraw && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setConfirmingWithdraw(true)}
        >
          Withdraw
        </Button>
      )}

      {creatorCanWithdraw && confirmingWithdraw && (
        <ConfirmAction
          message="Withdraw this offer? It will show as Declined afterward, since offers don't have a separate withdrawn status. This cannot be undone."
          confirmLabel="Confirm withdraw"
          busyLabel="Withdrawing…"
          busy={withdrawOffer.isPending}
          onCancel={() => setConfirmingWithdraw(false)}
          onConfirm={() => withdrawOffer.mutate()}
        />
      )}

      {mutationIsError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {negotiationErrorMessage(mutationError)}
        </div>
      )}
    </div>
  );
}
