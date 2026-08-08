"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { CandidateAttachments } from "./CandidateAttachments";
import { CandidateFields } from "./CandidateFields";
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
}

export function CandidateCard({ candidate, submissionId }: CandidateCardProps) {
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
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <CandidateFields candidate={candidate} />

        <CandidateAttachments candidateId={candidate.id} />
      </CardContent>
    </Card>
  );
}
