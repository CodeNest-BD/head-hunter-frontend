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
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
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
      return allMessages(error);
  }
}

interface SlotOption {
  id: string;
  startAt: string;
  endAt: string;
}

/**
 * What the viewer may do with *this* card — one value rather than a boolean
 * per button, because the choice is mutually exclusive and the booleans it
 * replaces disagreed about scope: "Withdraw" was gated only on the
 * interview's status, which the timeline stamps identically onto every
 * proposal event, so it rendered on superseded batches while its neighbour
 * correctly hid itself.
 *
 * - `recruiter-respond`: confirm one of these times, or ask for others.
 * - `company-manage`: replace these times, or withdraw the interview.
 * - `none`: pure history — a superseded, confirmed or dead-interview card.
 */
type CardActions = "none" | "recruiter-respond" | "company-manage";

/**
 * Both halves of a conjunction have to hold: this card's own batch must still
 * be awaiting a decision, *and* the interview must still be awaiting a time.
 * Neither implies the other — the backend only expires batches still in
 * `proposed`, so a `counter_requested` one outlives a later batch being
 * proposed and confirmed, and that stale card must not offer a Withdraw that
 * cancels an already-scheduled interview.
 *
 * So the interview gate is `=== "proposed"` rather than "not canceled or
 * completed": that also rules out `scheduled` and the schema's `unknown`
 * fallback, neither of which is a state this card can safely act in.
 */
function availableActions(
  viewerParty: ProposalCardProps["viewerParty"],
  proposalStatus: ProposalEventData["proposalStatus"],
  interviewStatus: ProposalEventData["interviewStatus"],
): CardActions {
  if (interviewStatus !== "proposed") return "none";

  switch (proposalStatus) {
    // The recruiter picks from an untouched batch; once they have asked for
    // other times the ball is the company's, which can propose a fresh batch
    // — or withdraw — from either open state.
    case "proposed":
      return viewerParty === "recruiter"
        ? "recruiter-respond"
        : "company-manage";
    case "counter_requested":
      return viewerParty === "company" ? "company-manage" : "none";
    default:
      return "none";
  }
}

/** The agreed time is carried on the event payload itself
 * (`confirmedSlotStart`/`End`), not fetched from the interview — slots are
 * never deleted once proposed, so `data.slots` alone can't say which one was
 * picked, but the backend now names it directly rather than the card needing
 * a second request. */
function ConfirmedTime({ start, end }: { start: string; end: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      <CalendarClock
        className="h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
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
              className="h-4 w-4 shrink-0 accent-primary"
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

  const isCounterRequested = proposalStatus === "counter_requested";
  const isConfirmed = proposalStatus === "confirmed";
  const actions = availableActions(
    viewerParty,
    proposalStatus,
    interviewStatus,
  );
  const recruiterCanRespond = actions === "recruiter-respond";
  // Only the company can create an interview, so the company is always the
  // proposer: replacing these times and withdrawing are the two ways out of
  // an open batch, and both stop being offered the moment the batch is
  // superseded or the interview stops awaiting a time.
  const companyCanManage = actions === "company-manage";

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

      {companyCanManage && !confirmingWithdraw && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowProposeForm(true)}
          >
            Propose new times
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmingWithdraw(true)}
          >
            Withdraw
          </Button>
        </div>
      )}

      {companyCanManage && confirmingWithdraw && (
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
