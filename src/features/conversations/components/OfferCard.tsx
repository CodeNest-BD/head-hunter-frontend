"use client";

import { useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle, FileText, Info } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
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
  /** When the offer event landed in the thread — shown as "Sent {date}". The
   * offer payload itself carries no timestamp, so the thread passes the
   * event's own `at`. */
  sentAt?: string;
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
    withdrawn: "Withdrawn",
    unknown: "Status unknown",
  };

/** Status-pill tint, matched to the stage the offer is at. */
const OFFER_STATUS_TONES: Record<OfferEventData["offerStatus"], string> = {
  sent: "border-[#F0DFC3] bg-[#FBF1E3] text-[#85570F]",
  accepted: "border-[#CFE5D9] bg-[#E7F2EC] text-[#1F6444]",
  declined: "border-destructive/30 bg-destructive/10 text-destructive",
  countered: "border-primary/25 bg-primary/10 text-primary",
  superseded: "border-border bg-secondary text-muted-foreground",
  withdrawn: "border-border bg-secondary text-muted-foreground",
  unknown: "border-border bg-secondary text-muted-foreground",
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
export function OfferCard({
  data,
  viewerParty,
  candidateId,
  sentAt,
}: OfferCardProps) {
  const {
    offerId,
    offerStatus,
    amountMinor,
    salaryMinor,
    startDate,
    previousOfferId,
    createdBy,
    companyCanCoverFee,
  } = data;
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const notifyCompany = useSendMessage(candidateId, viewerParty);
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

  // "Your fee" reads right for the recruiter who earns it; the company sees
  // whose fee it is instead.
  const feeLabel = viewerParty === "recruiter" ? "Your fee" : "Recruiter's fee";
  const feeNote =
    viewerParty === "recruiter"
      ? "Your fee is fixed and not part of this negotiation."
      : "The recruiter's fee is fixed and not part of this negotiation.";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-navy">Offer</span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
            OFFER_STATUS_TONES[offerStatus],
          )}
        >
          {OFFER_EVENT_STATUS_LABELS[offerStatus]}
        </span>
        {sentAt ? (
          <span className="ml-auto text-[11px] text-muted-foreground">
            Sent {formatDate(sentAt)}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-4">
        {previousOfferId && (
          <p className="text-xs text-muted-foreground">
            Counters a previous offer.
          </p>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-3xl font-bold tracking-tight text-navy">
              {formatMinor(salaryMinor)}
            </span>
            <span className="text-xs text-muted-foreground">
              base salary / year
            </span>
          </div>
          <div className="grid flex-1 gap-2 sm:min-w-[240px] sm:grid-cols-2">
            {startDate && (
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <p className="text-[10.5px] font-semibold text-muted-foreground">
                  Start date
                </p>
                <p className="text-[13px] font-semibold text-navy">
                  {formatDate(startDate)}
                </p>
              </div>
            )}
            {/* The commission is fixed by the job's advertised fee and
                read-only — shown, never editable, and kept apart from the
                salary so it can't be mistaken for part of the negotiation. */}
            <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
              <p className="text-[10.5px] font-semibold text-muted-foreground">
                {feeLabel}
              </p>
              <p className="flex items-baseline gap-1.5 text-[13px] font-semibold text-navy">
                {formatMinor(amountMinor)}
                <span className="text-[11px] font-normal text-muted-foreground">
                  fixed
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 border-t border-border/60 pt-3 text-[11.5px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{feeNote}</span>
        </div>

        {/* A hire (accepted offer) is what unlocks the company's review of the
            recruiter — one per hire, editable afterwards. */}
        {offerStatus === "accepted" && viewerParty === "company" && (
          <ReviewCta offerId={offerId} />
        )}

        {companyCannotFund && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
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
            message="Withdraw this offer? The candidate will go back to their previous status."
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
    </div>
  );
}
