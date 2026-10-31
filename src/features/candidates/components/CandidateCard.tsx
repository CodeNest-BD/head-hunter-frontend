"use client";

import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { CandidateDetailPanel } from "./CandidateDetailPanel";
import { PassCandidateAction } from "./PassCandidateAction";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";
import { SendOfferForm } from "./SendOfferForm";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";
import { CANDIDATE_STATUS_LABELS, type Candidate } from "../schemas";

interface CandidateCardProps {
  candidate: Candidate;
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet — the caller
   * derives the map once per page, never per card. */
  negotiationState: CandidateNegotiationState | null;
}

/** The company's view of a submitted candidate: the shared panel, plus the
 * interview, offer and pass decisions only the company makes. */
export function CandidateCard({
  candidate,
  negotiationState,
}: CandidateCardProps) {
  return (
    <CandidateDetailPanel
      candidate={candidate}
      viewerParty="company"
      stageLabel={CANDIDATE_STATUS_LABELS[candidate.status]}
      stageTone={CANDIDATE_STATUS_TONES[candidate.status]}
      // Read-only status only. Responding to a live offer or interview
      // proposal happens on the actionable cards in the conversation beside
      // this panel — one place to act, not two. Creating a new interview or
      // offer still starts here.
      negotiation={
        <NegotiationStateBadges
          interview={negotiationState?.interview ?? null}
          offer={negotiationState?.offer ?? null}
          viewerParty="company"
        />
      }
      actions={
        candidate.status === "passed" ? (
          <p className="text-meta text-ink-muted">
            This candidate was passed on, so no more interviews or offers can be
            sent.
          </p>
        ) : (
          // Capped so the buttons read as one equal-width stack in a wide
          // column, and an expanded scheduling form keeps the width it was
          // laid out for.
          <div className="flex max-w-sm flex-col gap-2">
            <ScheduleInterviewAction
              candidateId={candidate.id}
              negotiationState={negotiationState}
            />
            {/* A hire is undone through the placement's guarantee, which
                refunds the fee — never by passing. */}
            {candidate.status !== "hired" && (
              <PassCandidateAction candidateId={candidate.id} />
            )}
            <SendOfferForm
              candidateId={candidate.id}
              negotiationState={negotiationState}
            />
          </div>
        )
      }
    />
  );
}
