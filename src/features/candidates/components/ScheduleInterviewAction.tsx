"use client";

import { useId, useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  ProposeSlotsForm,
  useCreateInterview,
  useInterviews,
  type InterviewType,
} from "@/features/interviews";
import { isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";

export interface ScheduleInterviewActionProps {
  candidateId: string;
}

// One interview per candidate may be `proposed` (awaiting a time) or
// `scheduled` (a time is confirmed) at a time — the same rule
// `createInterview`'s 409 enforces server-side.
const OPEN_INTERVIEW_STATUSES = new Set(["proposed", "scheduled"]);

function createInterviewErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not start scheduling. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Conflict:
      return "This candidate already has an interview awaiting a time or scheduled.";
    default:
      return error.message;
  }
}

/**
 * The company's entry point into the scheduling flow, alongside the other
 * decisions a company makes about a candidate (see the status select right
 * above this in `CandidateCard`). Creates the interview, then hands off
 * straight into proposing the first batch of times.
 *
 * Detects an already-open interview by reading this candidate's own
 * interview list rather than a dedicated "has open interview" endpoint —
 * there is no such endpoint, and the list is already scoped per-candidate —
 * so the action disables itself with a readable reason instead of letting
 * the create endpoint's 409 surface raw.
 */
export function ScheduleInterviewAction({
  candidateId,
}: ScheduleInterviewActionProps) {
  const disabledReasonId = useId();
  const [interviewType, setInterviewType] = useState<InterviewType>("video");
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(
    null,
  );
  const { data: interviews, isPending: interviewsPending } = useInterviews({
    candidateId,
    limit: 50,
  });
  const createInterview = useCreateInterview();

  const openInterview = interviews?.data.find((interview) =>
    OPEN_INTERVIEW_STATUSES.has(interview.status),
  );

  if (activeInterviewId) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
        <p className="text-sm font-medium text-foreground">
          Propose interview times
        </p>
        <ProposeSlotsForm
          interviewId={activeInterviewId}
          onDone={() => setActiveInterviewId(null)}
        />
      </div>
    );
  }

  const disabledReason = openInterview
    ? `This candidate already has an interview ${
        openInterview.status === "scheduled" ? "scheduled" : "awaiting a time"
      }.`
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select
          aria-label="Interview type"
          value={interviewType}
          disabled={Boolean(disabledReason)}
          onChange={(event) => {
            // A native select's onChange only ever gives a string; parsing it
            // against the same schema the API layer validates with means an
            // unexpected DOM value is caught here instead of flowing into
            // the mutation's request body.
            const parsed = interviewTypeSchema.safeParse(event.target.value);
            if (parsed.success) setInterviewType(parsed.data);
          }}
          className="h-9 shrink-0 rounded-md border border-input bg-card px-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {INTERVIEW_TYPES.map((type) => (
            <option key={type} value={type}>
              {INTERVIEW_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          disabled={
            Boolean(disabledReason) ||
            interviewsPending ||
            createInterview.isPending
          }
          aria-describedby={disabledReason ? disabledReasonId : undefined}
          onClick={() =>
            createInterview.mutate(
              { candidateId, interviewType },
              { onSuccess: (interview) => setActiveInterviewId(interview.id) },
            )
          }
        >
          {createInterview.isPending ? "Scheduling…" : "Schedule interview"}
        </Button>
      </div>
      {disabledReason && (
        <p id={disabledReasonId} className="text-xs text-muted-foreground">
          {disabledReason}
        </p>
      )}
      {createInterview.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {createInterviewErrorMessage(createInterview.error)}
        </div>
      )}
    </div>
  );
}
