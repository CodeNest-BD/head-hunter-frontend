"use client";

import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { NegotiationActionCards } from "@/shared/ui-components/data/NegotiationActionCards";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { CandidateAttachments } from "./CandidateAttachments";
import { CandidateFields } from "./CandidateFields";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";
import { SendOfferForm } from "./SendOfferForm";
import { CANDIDATE_STATUS_STYLES } from "./statusStyles";
import { CANDIDATE_STATUS_LABELS, type Candidate } from "../schemas";

interface CandidateCardProps {
  candidate: Candidate;
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet — the caller
   * derives the map once per page, never per card. */
  negotiationState: CandidateNegotiationState | null;
}

export function CandidateCard({
  candidate,
  negotiationState,
}: CandidateCardProps) {
  return (
    <Card className="border-border/70 transition-colors hover:border-border">
      {/* Only the status badge sits beside the name. The interview and offer
          actions moved into the body: both expand into full-width panels, so
          stacking them here made a tall right column next to a two-line left
          one — the empty band this card used to carry. */}
      <CardHeader className="flex-col items-start justify-between gap-2 space-y-0 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <CardTitle className="font-heading tracking-tight">
            {candidate.fullName}
          </CardTitle>
          <CardDescription>
            <a
              href={`mailto:${candidate.email}`}
              className="text-primary underline-offset-2 hover:underline"
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
            className={CANDIDATE_STATUS_STYLES[candidate.status]}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <NegotiationStateBadges
          interview={negotiationState?.interview ?? null}
          offer={negotiationState?.offer ?? null}
        />

        <NegotiationActionCards
          negotiationState={negotiationState}
          viewerParty="company"
          candidateId={candidate.id}
        />

        <ScheduleInterviewAction
          candidateId={candidate.id}
          negotiationState={negotiationState}
        />
        <SendOfferForm
          candidateId={candidate.id}
          negotiationState={negotiationState}
        />

        <CandidateFields candidate={candidate} />

        <CandidateAttachments candidateId={candidate.id} />
      </CardContent>
    </Card>
  );
}
