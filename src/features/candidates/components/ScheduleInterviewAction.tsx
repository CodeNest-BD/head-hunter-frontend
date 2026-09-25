"use client";

import { useState } from "react";

import {
  OpenInterviewActions,
  ProposeSlotsForm,
  type Interview,
} from "@/features/interviews";
import {
  isInterviewOpen,
  isOfferLive,
  type CandidateNegotiationState,
} from "@/features/conversations/utils/candidateNegotiationState";
import { Button } from "@/shared/ui-components/controls/button";

export interface ScheduleInterviewActionProps {
  candidateId: string;
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet — derived once
   * per page from the page-level `useInterviews({ candidateId })` query,
   * never fetched per candidate here. */
  negotiationState: CandidateNegotiationState | null;
}

/**
 * The panel replaces the button while it is open. `proposed` covers the beat
 * between a successful submit and the page-level interviews query learning
 * about it — without it the button would reappear and invite a second
 * interview that could only 409. It carries the latest interview as of the
 * submit, because that is the only way to tell that beat from a later one:
 * once the query reports a different interview, this state has served its
 * purpose and holding the card quiet on it would strand the candidate with no
 * control at all.
 */
type SchedulePanel =
  | { kind: "none" }
  | { kind: "proposing" }
  | { kind: "proposed"; latestInterviewIdBefore: string | null };

/**
 * Whether the company may open another round. A `completed` interview only
 * invites one when its outcome was `next_round` — `offer` hands the candidate
 * to `SendOfferForm` below this, and `pass` ends them. A `canceled` one
 * decided nothing, so starting over is fair.
 */
function acceptsAnotherRound(latest: Interview | null): boolean {
  if (!latest || latest.status !== "completed") {
    return true;
  }
  return latest.outcome === "next_round";
}

/**
 * The company's entry point into the scheduling flow, alongside the other
 * decisions a company makes about a candidate (see the status select right
 * above this in `CandidateCard`).
 *
 * Nothing is written until times are actually proposed: the type and the times
 * are picked in one panel and `ProposeSlotsForm` opens the interview as it
 * sends them. Creating the interview on the button click instead used to leave
 * a candidate holding an empty `proposed` interview that blocked every later
 * one, with withdrawing as the only way out.
 *
 * A candidate may only have one open interview, so once one exists this hands
 * over to `OpenInterviewActions` for it — read from the `negotiationState` its
 * parent already derived from the page-level interviews query, since there is
 * no "has open interview" endpoint.
 */
export function ScheduleInterviewAction({
  candidateId,
  negotiationState,
}: ScheduleInterviewActionProps) {
  const [panel, setPanel] = useState<SchedulePanel>({ kind: "none" });

  const latestInterview = negotiationState?.interviewRecord ?? null;
  // One interview per candidate may be open at a time — the same rule
  // `createInterview`'s 409 enforces server-side.
  const openInterview = isInterviewOpen(negotiationState?.interview ?? null)
    ? latestInterview
    : null;

  if (openInterview) {
    return (
      <OpenInterviewActions key={openInterview.id} interview={openInterview} />
    );
  }

  const isAwaitingRefetch =
    panel.kind === "proposed" &&
    panel.latestInterviewIdBefore === (latestInterview?.id ?? null);

  if (
    isAwaitingRefetch ||
    isOfferLive(negotiationState?.offer ?? null) ||
    !acceptsAnotherRound(latestInterview)
  ) {
    return null;
  }

  if (panel.kind === "proposing") {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
        <p className="text-sm font-medium text-foreground">
          Schedule Interview
        </p>
        <ProposeSlotsForm
          target={{ kind: "new", candidateId }}
          onDone={() =>
            setPanel({
              kind: "proposed",
              latestInterviewIdBefore: latestInterview?.id ?? null,
            })
          }
          onCancel={() => setPanel({ kind: "none" })}
        />
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className="self-start"
      onClick={() => setPanel({ kind: "proposing" })}
    >
      {latestInterview?.outcome === "next_round"
        ? "Schedule next round"
        : "Schedule interview"}
    </Button>
  );
}
