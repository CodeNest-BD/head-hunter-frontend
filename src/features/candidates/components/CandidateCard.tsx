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
import { CandidateAttachments } from "./CandidateAttachments";
import { CandidateFields } from "./CandidateFields";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";
import { SendOfferForm } from "./SendOfferForm";
import { useUpdateCandidateStatus } from "../hooks/useCandidates";
import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
  type Candidate,
  type CandidateStatus,
} from "../schemas";

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
  const updateStatus = useUpdateCandidateStatus(candidate.jobId);

  return (
    <Card className="border-border/70 transition-colors hover:border-border">
      {/* Only the status select sits beside the name. The interview and offer
          actions moved into the body: both expand into full-width panels, so
          stacking them here made a tall right column next to a two-line left
          one — the empty band this card used to carry. */}
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 p-4">
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
        <div className="shrink-0">
          <select
            id={`candidate-status-${candidate.id}`}
            aria-label={`Status for ${candidate.fullName}`}
            value={candidate.status}
            disabled={updateStatus.isPending}
            onChange={(event) =>
              updateStatus.mutate({
                id: candidate.id,
                status: event.target.value as CandidateStatus,
              })
            }
            className="h-9 shrink-0 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {CANDIDATE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CANDIDATE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
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
