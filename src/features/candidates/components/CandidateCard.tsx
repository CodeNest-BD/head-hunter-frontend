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
  submissionId: string;
  /** This candidate's entry from `candidateNegotiationState`, or `null` when
   * the candidate has neither an interview nor an offer yet — the caller
   * derives the map once per page, never per card. */
  negotiationState: CandidateNegotiationState | null;
}

export function CandidateCard({
  candidate,
  submissionId,
  negotiationState,
}: CandidateCardProps) {
  const updateStatus = useUpdateCandidateStatus(submissionId);

  return (
    <Card className="border-border/70 transition-colors hover:border-border">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`candidate-status-${candidate.id}`}
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
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

          <ScheduleInterviewAction candidateId={candidate.id} />
          <SendOfferForm candidateId={candidate.id} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <NegotiationStateBadges
          interview={negotiationState?.interview ?? null}
          offer={negotiationState?.offer ?? null}
        />

        <NegotiationActionCards
          negotiationState={negotiationState}
          viewerParty="company"
        />

        <CandidateFields candidate={candidate} />

        <CandidateAttachments candidateId={candidate.id} />
      </CardContent>
    </Card>
  );
}
