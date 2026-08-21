"use client";

import { useId, useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle, CalendarClock } from "lucide-react";

import {
  ProposeSlotsForm,
  useCancelInterview,
  useConfirmSlot,
  useCounterRequest,
  withdrawInterviewErrorMessage,
} from "@/features/interviews";
import { isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ConversationEvent } from "../schemas";

const MAX_COUNTER_NOTE_LENGTH = 2000;

export type ProposalEventData = Extract<
  NonNullable<ConversationEvent["data"]>,
  { kind: "proposal" }
>;

export interface ProposalCardProps {
  /** Server-computed heading for this entry, e.g. "Availability proposed" —
   * reused rather than recomputed from `data.proposalStatus` client-side, so
   * the wording can never drift from `PROPOSAL_TITLES` on the backend. */
  title: string;
  /** The event's body: null for a fresh proposal, the recruiter's ask when
   * `proposalStatus` is `counter_requested`. */
  note: string | null;
  data: ProposalEventData;
  viewerParty: "company" | "recruiter";
}

/**
 * 403 (wrong party), 404 (a slot no longer part of this proposal, e.g. a
 * stale card confirming against a batch that has since been replaced) and
 * 409 (the proposal is no longer open) are all reachable in normal use —
 * `confirmSlot`/`counterRequest` document the same three — so each gets a
 * specific inline message instead of the mutation's raw error.
 */
function schedulingErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Something went wrong. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Forbidden:
      return "Only the recruiter on this submission can respond to a proposal.";
    case HttpStatusCode.NotFound:
      return "This time is no longer part of the proposal — refresh and try again.";
    case HttpStatusCode.Conflict:
      return "This proposal is no longer open.";
    default:
      return error.message;
  }
}

interface SlotOption {
  id: string;
  startAt: string;
  endAt: string;
}

/** The agreed time is carried on the event payload itself
 * (`confirmedSlotStart`/`End`), not fetched from the interview — slots are
 * never deleted once proposed, so `data.slots` alone can't say which one was
 * picked, but the backend now names it directly rather than the card needing
 * a second request. */
function ConfirmedTime({ start, end }: { start: string; end: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
      {formatDateTime(start)} – {formatDateTime(end)}
    </p>
  );
}

function ReadOnlySlots({ slots }: { slots: SlotOption[] }) {
  if (slots.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {slots.map((slot) => (
        <li
          key={slot.id}
          className="rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground"
        >
          {formatDateTime(slot.startAt)} – {formatDateTime(slot.endAt)}
        </li>
      ))}
    </ul>
  );
}

interface SlotRadioGroupProps {
  slots: SlotOption[];
  selectedSlotId: string | null;
  onSelect: (slotId: string) => void;
}

/** A choice between 1-5 candidate windows is radio-group-shaped: exactly one
 * of several mutually exclusive options, so it is built from native radios
 * (not styled toggle buttons) for the "n of m" announcement a screen reader
 * gives that grouping for free. */
function SlotRadioGroup({
  slots,
  selectedSlotId,
  onSelect,
}: SlotRadioGroupProps) {
  const groupName = useId();
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-xs font-medium text-muted-foreground">
        Choose a time
      </legend>
      {slots.map((slot) => {
        const optionId = `${groupName}-${slot.id}`;
        return (
          <label
            key={slot.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/50",
              selectedSlotId === slot.id && "border-primary bg-primary/10",
            )}
          >
            <input
              type="radio"
              id={optionId}
              name={groupName}
              value={slot.id}
              checked={selectedSlotId === slot.id}
              onChange={() => onSelect(slot.id)}
              className="h-4 w-4 accent-primary"
            />
            {formatDateTime(slot.startAt)} – {formatDateTime(slot.endAt)}
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * The actionable meeting-invite entry in a job's conversation thread. State —
 * which actions are available — comes entirely from `data.proposalStatus`
 * and `data.interviewStatus`; there is no local "was this confirmed" flag, so
 * a mutation that fails leaves the card exactly where the server says the
 * proposal actually is once the thread refetches.
 */
export function ProposalCard({
  title,
  note,
  data,
  viewerParty,
}: ProposalCardProps) {
  const {
    interviewId,
    availabilityProposalId,
    proposalStatus,
    interviewStatus,
    confirmedSlotStart,
    confirmedSlotEnd,
    slots,
  } = data;
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterNote, setCounterNote] = useState("");
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const counterNoteHintId = useId();

  const confirmSlot = useConfirmSlot(interviewId, availabilityProposalId);
  const counterRequest = useCounterRequest(interviewId, availabilityProposalId);
  const cancelInterview = useCancelInterview(interviewId);

  const isOpen = proposalStatus === "proposed";
  const isCounterRequested = proposalStatus === "counter_requested";
  const isConfirmed = proposalStatus === "confirmed";
  // A batch can stay "proposed" or "counter_requested" right up to the moment
  // the interview around it is canceled or completed — the proposal status
  // alone doesn't say that, so every action below also checks this.
  const isDeadInterview =
    interviewStatus === "canceled" || interviewStatus === "completed";
  const canAct = !isDeadInterview;
  // Proposing a fresh batch only fails once the interview itself has left
  // "awaiting a time" — which happens the moment a slot is confirmed, not
  // when the recruiter merely asks for other times — so the company can
  // still propose again from either open proposal state.
  const companyCanProposeAgain =
    viewerParty === "company" && (isOpen || isCounterRequested) && canAct;
  const recruiterCanRespond = viewerParty === "recruiter" && isOpen && canAct;
  // Only the company can create an interview, so the company is always the
  // proposer — withdraw is its way out of the one-open-interview rule, and
  // it stays offered through a counter-request since the interview is still
  // "awaiting a time" right up until a slot is confirmed or it is canceled.
  const companyCanWithdraw =
    viewerParty === "company" && interviewStatus === "proposed";

  if (showProposeForm) {
    return (
      <div className="flex flex-col gap-2.5 rounded-md border border-border/70 bg-card p-3">
        <p className="text-sm font-semibold text-foreground">
          Propose new times
        </p>
        <ProposeSlotsForm
          interviewId={interviewId}
          onDone={() => setShowProposeForm(false)}
          onCancel={() => setShowProposeForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border/70 bg-card p-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>

      {isConfirmed ? (
        confirmedSlotStart && confirmedSlotEnd ? (
          <ConfirmedTime start={confirmedSlotStart} end={confirmedSlotEnd} />
        ) : null
      ) : isCounterRequested ? null : recruiterCanRespond ? (
        <SlotRadioGroup
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelect={setSelectedSlotId}
        />
      ) : (
        <ReadOnlySlots slots={slots} />
      )}

      {recruiterCanRespond && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!selectedSlotId || confirmSlot.isPending}
            onClick={() => {
              if (selectedSlotId) confirmSlot.mutate(selectedSlotId);
            }}
          >
            {confirmSlot.isPending ? "Confirming…" : "Confirm"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCounterForm((shown) => !shown)}
          >
            Request other times
          </Button>
        </div>
      )}

      {recruiterCanRespond && showCounterForm && (
        <div className="flex flex-col gap-2">
          <p id={counterNoteHintId} className="text-xs text-muted-foreground">
            Tells the company what would work better instead.
          </p>
          <Textarea
            value={counterNote}
            onChange={(event) => setCounterNote(event.target.value)}
            maxLength={MAX_COUNTER_NOTE_LENGTH}
            placeholder="Mornings only, please…"
            aria-label="Note for the company"
            aria-describedby={counterNoteHintId}
          />
          <Button
            type="button"
            size="sm"
            className="self-start"
            disabled={
              counterNote.trim().length === 0 || counterRequest.isPending
            }
            onClick={() =>
              counterRequest.mutate(counterNote.trim(), {
                onSuccess: () => {
                  setShowCounterForm(false);
                  setCounterNote("");
                },
              })
            }
          >
            {counterRequest.isPending ? "Sending…" : "Send request"}
          </Button>
        </div>
      )}

      {(companyCanProposeAgain || companyCanWithdraw) &&
        !confirmingWithdraw && (
          <div className="flex flex-wrap items-center gap-2">
            {companyCanProposeAgain && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProposeForm(true)}
              >
                Propose new times
              </Button>
            )}
            {companyCanWithdraw && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmingWithdraw(true)}
              >
                Withdraw
              </Button>
            )}
          </div>
        )}

      {companyCanWithdraw && confirmingWithdraw && (
        <ConfirmAction
          message="Withdraw this interview proposal? This cancels the interview and cannot be undone."
          confirmLabel="Confirm withdraw"
          busyLabel="Withdrawing…"
          busy={cancelInterview.isPending}
          onCancel={() => setConfirmingWithdraw(false)}
          onConfirm={() => cancelInterview.mutate()}
        />
      )}

      {(confirmSlot.isError ||
        counterRequest.isError ||
        cancelInterview.isError) && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {cancelInterview.isError
            ? withdrawInterviewErrorMessage(cancelInterview.error)
            : schedulingErrorMessage(confirmSlot.error ?? counterRequest.error)}
        </div>
      )}
    </div>
  );
}
