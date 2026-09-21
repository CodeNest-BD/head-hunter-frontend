"use client";

import { useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import { useSendMessage } from "../hooks/useConversation";
import {
  useAcceptOffer,
  useCounterOffer,
  useDeclineOffer,
  useWithdrawOffer,
} from "@/features/offers";
import { ReviewCta } from "@/features/reviews";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import type { ConversationEvent } from "../schemas";
import { CounterOfferForm, type CounterOfferTerms } from "./CounterOfferForm";

export type OfferEventData = Extract<
  NonNullable<ConversationEvent["data"]>,
  { kind: "offer" }
>;

export interface OfferCardProps {
  data: OfferEventData;
  viewerParty: "company" | "recruiter";
  /** The thread this offer belongs to — what "Notify Company" writes into. */
  candidateId: string;
}

/** Sent verbatim by "Notify Company", so the company reads why the offer is
 * sitting there rather than guessing at silence. */
const UNFUNDED_NOTICE =
  "I cannot accept your offer due to your lack of balance.";

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
      return allMessages(error);
  }
}

/**
 * The actionable offer entry in a job's conversation thread. State — which
 * actions are available — comes entirely from `data.offerStatus` compared
 * with `data.createdBy` and the viewer's own party; there is no local "was
 * this accepted" flag, so a mutation that fails leaves the card exactly
 * where the server says the offer actually is once the thread refetches.
 *
 * Only the live offer (`offerStatus === "sent"`) exposes buttons, so a
 * thread's historical offer events render read-only on their own — the card
 * needs no external "read-only" flag to stay quiet in the timeline.
 */
export function OfferCard({ data, viewerParty, candidateId }: OfferCardProps) {
  const {
    offerId,
    offerStatus,
    amountMinor,
    salaryMinor,
    jobTitle,
    startDate,
    previousOfferId,
    createdBy,
    companyCanCoverFee,
  } = data;
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const notifyCompany = useSendMessage(candidateId);
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
  // Accepting is what holds the fee in escrow, so an underfunded company means
  // the accept would be refused server-side. `null` is "not reported" — only a
  // definite false blocks the button. Recruiter-only: on a recruiter-created
  // offer the company is the counterparty, and neither this notice nor a
  // "Notify Company" button makes sense addressed to the company itself.
  const companyCannotFund =
    viewerParty === "recruiter" &&
    counterpartyCanRespond &&
    companyCanCoverFee === false;

  const mutationError =
    acceptOffer.error ??
    declineOffer.error ??
    counterOffer.error ??
    withdrawOffer.error ??
    notifyCompany.error;
  const mutationIsError =
    acceptOffer.isError ||
    declineOffer.isError ||
    counterOffer.isError ||
    withdrawOffer.isError ||
    // `sendMessage` suppresses the global toast, so without this a failed
    // notify would leave the recruiter believing the company was told.
    notifyCompany.isError;

  const submitCounter = (terms: CounterOfferTerms): void => {
    counterOffer.mutate(terms, {
      onSuccess: () => setShowCounterForm(false),
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-navy">Offer</p>
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
          {formatMinor(salaryMinor)}
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
      <div className="flex flex-wrap items-baseline gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
        <span>Recruiter&apos;s fee (fixed, not part of this negotiation):</span>
        <span className="font-medium text-foreground">
          {formatMinor(amountMinor)}
        </span>
      </div>

      {companyCannotFund && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            The company has not enough balance to proceed.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={notifyCompany.isPending || notifyCompany.isSuccess}
            onClick={() => notifyCompany.mutate({ body: UNFUNDED_NOTICE })}
          >
            {notifyCompany.isPending
              ? "Notifying…"
              : notifyCompany.isSuccess
                ? "Company Notified"
                : "Notify Company"}
          </Button>
        </div>
      )}

      {counterpartyCanRespond && !showCounterForm && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={acceptOffer.isPending || companyCannotFund}
            onClick={() => acceptOffer.mutate()}
          >
            {acceptOffer.isPending ? "Accepting…" : "Accept"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={declineOffer.isPending}
            onClick={() => declineOffer.mutate()}
          >
            {declineOffer.isPending ? "Declining…" : "Decline"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setShowCounterForm(true)}
          >
            Counter
          </Button>
        </div>
      )}

      {counterpartyCanRespond && showCounterForm && (
        <CounterOfferForm
          isPending={counterOffer.isPending}
          onSubmit={submitCounter}
          onCancel={() => setShowCounterForm(false)}
        />
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
