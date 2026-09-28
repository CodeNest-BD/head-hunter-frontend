"use client";

import { useId, useState } from "react";
import { HttpStatusCode } from "axios";
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
} from "lucide-react";

import {
  ProposedSlotList,
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
import { Tile, type TileTone } from "@/shared/ui-components/list/Tile";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ConversationEvent } from "../schemas";

const MAX_COUNTER_NOTE_LENGTH = 2000;

export type ProposalEventData = Extract<
  NonNullable<ConversationEvent["data"]>,
  { kind: "proposal" }
>;

/**
 * The icon tile that leads the card, tinted to the proposal's stage: a live
 * ask reads as neutral/primary, a confirmed time as settled green, a
 * superseded batch as muted history. Keeps the wording (server-computed
 * `title`) and the colour in one glance without a second status pill.
 */
const PROPOSAL_TONES: Record<
  ProposalEventData["proposalStatus"],
  { tone: TileTone; Icon: typeof CalendarClock }
> = {
  proposed: { tone: "blue", Icon: CalendarClock },
  counter_requested: { tone: "warn", Icon: CalendarClock },
  confirmed: { tone: "ok", Icon: CalendarCheck },
  expired: { tone: "neutral", Icon: CalendarX2 },
  unknown: { tone: "neutral", Icon: CalendarClock },
};

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
    <p className="flex items-center gap-2 rounded-sm border border-ok-line bg-ok-bg px-3 py-2 text-sub font-[650] text-ok">
      <CalendarCheck className="size-[15px] shrink-0" aria-hidden="true" />
      <span>
        {formatDateTime(start)} – {formatDateTime(end)}
      </span>
    </p>
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
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-0.5 text-label font-[650] uppercase text-ink-muted">
        Choose a time
      </legend>
      {slots.map((slot) => {
        const optionId = `${groupName}-${slot.id}`;
        return (
          <label
            key={slot.id}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2 text-sub transition-colors",
              selectedSlotId === slot.id
                ? "border-blue bg-tint font-[550] text-ink shadow-[inset_0_0_0_1px_var(--blue)]"
                : "border-line-strong text-ink-body hover:border-blue-ink hover:bg-surface-sub",
            )}
          >
            <input
              type="radio"
              id={optionId}
              name={groupName}
              value={slot.id}
              checked={selectedSlotId === slot.id}
              onChange={() => onSelect(slot.id)}
              className="size-4 shrink-0 accent-[color:var(--blue)]"
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

  const tone = PROPOSAL_TONES[proposalStatus];

  if (showProposeForm) {
    return (
      // `.eventcard`
      <div className="mx-auto flex max-w-[420px] flex-col gap-3 overflow-hidden rounded-md border border-line bg-surface p-3 shadow-e1">
        <div className="flex items-center gap-2.5">
          <Tile icon={CalendarClock} tone="blue" />
          <p className="text-sub font-[650] text-ink">Propose new times</p>
        </div>
        <ProposeSlotsForm
          target={{ kind: "existing", interviewId }}
          onDone={() => setShowProposeForm(false)}
          onCancel={() => setShowProposeForm(false)}
        />
      </div>
    );
  }

  return (
    // `.eventcard` — a 420px structured moment inside the thread.
    <div className="mx-auto flex max-w-[420px] flex-col gap-3 overflow-hidden rounded-md border border-line bg-surface p-3 text-[12.5px] shadow-e1">
      <div className="flex items-start gap-2.5">
        <Tile icon={tone.Icon} tone={tone.tone} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sub font-[650] text-ink">{title}</p>
          {note && (
            <p className="text-meta leading-snug text-ink-muted">{note}</p>
          )}
        </div>
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
        <ProposedSlotList slots={slots} />
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
          <p id={counterNoteHintId} className="text-meta text-ink-muted">
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
        <div className="flex items-center gap-2 rounded-sm border border-bad-line bg-bad-bg px-3 py-2 text-meta text-bad">
          <AlertCircle className="size-3.5 shrink-0" />
          {cancelInterview.isError
            ? withdrawInterviewErrorMessage(cancelInterview.error)
            : schedulingErrorMessage(confirmSlot.error ?? counterRequest.error)}
        </div>
      )}
    </div>
  );
}
