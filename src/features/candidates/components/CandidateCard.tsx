"use client";

import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { CandidateAttachments } from "./CandidateAttachments";
import { CandidateFields } from "./CandidateFields";
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
  /** Extra classes for the card root, e.g. to fill an inbox rail's height. */
  className?: string;
}

export function CandidateCard({
  candidate,
  negotiationState,
  className,
}: CandidateCardProps) {
  return (
    <Card
      className={cn("transition-colors hover:border-line-strong", className)}
    >
      {/* Only the status badge sits beside the name. The interview and offer
          actions moved into the body: both expand into full-width panels, so
          stacking them here made a tall right column next to a two-line left
          one — the empty band this card used to carry. */}
      <CardHeader className="flex-nowrap items-start justify-between gap-2.5 sm:items-center">
        <div className="flex min-w-0 flex-col gap-0.5">
          <CardTitle>{candidate.fullName}</CardTitle>
          <CardDescription>
            <a
              href={`mailto:${candidate.email}`}
              className="text-blue-ink underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </CardDescription>
        </div>
        {/* Read-only: the status follows the interview and offer events on
            this candidate, so there is nothing here to set by hand. */}
        <div className="shrink-0">
          <StatusBadge
            label={CANDIDATE_STATUS_LABELS[candidate.status]}
            tone={CANDIDATE_STATUS_TONES[candidate.status]}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Read-only status only. Responding to a live offer or interview
            proposal happens on the actionable cards in the conversation
            thread beside this rail — one place to act, not two. Creating a
            new interview or offer still starts here, below. */}
        <NegotiationStateBadges
          interview={negotiationState?.interview ?? null}
          offer={negotiationState?.offer ?? null}
          viewerParty="company"
        />

        {candidate.status === "passed" ? (
          <p className="text-meta text-ink-muted">
            This candidate was passed on, so no more interviews or offers can be
            sent.
          </p>
        ) : (
          <>
            <ScheduleInterviewAction
              candidateId={candidate.id}
              negotiationState={negotiationState}
            />
            <SendOfferForm
              candidateId={candidate.id}
              negotiationState={negotiationState}
            />
            {/* A hire is undone through the placement's guarantee, which
                refunds the fee — never by passing. */}
            {candidate.status !== "hired" && (
              <PassCandidateAction candidateId={candidate.id} />
            )}
          </>
        )}

        <CandidateFields candidate={candidate} />

        <CandidateAttachments candidateId={candidate.id} />
      </CardContent>
    </Card>
  );
}
