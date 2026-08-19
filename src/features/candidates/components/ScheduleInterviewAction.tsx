"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import {
  createInterviewErrorMessage,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  OpenInterviewActions,
  useCreateInterview,
  useInterviews,
  type Interview,
  type InterviewType,
} from "@/features/interviews";
import { Button } from "@/shared/ui-components/controls/button";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";

export interface ScheduleInterviewActionProps {
  candidateId: string;
}

// One interview per candidate may be `proposed` (awaiting a time) or
// `scheduled` (a time is confirmed) at a time — the same rule
// `createInterview`'s 409 enforces server-side.
const OPEN_INTERVIEW_STATUSES = new Set(["proposed", "scheduled"]);

function isOpen(interview: Interview): boolean {
  return OPEN_INTERVIEW_STATUSES.has(interview.status);
}

/**
 * The company's entry point into the scheduling flow, alongside the other
 * decisions a company makes about a candidate (see the status select right
 * above this in `CandidateCard`).
 *
 * A candidate may only have one open interview, so this either starts one or
 * hands over to `OpenInterviewActions` for the one already open — the open
 * interview is read from this candidate's own interview list (there is no
 * "has open interview" endpoint, and the list is already scoped per-candidate)
 * falling back to the interview this very component just created, which the
 * list may not have refetched yet.
 */
export function ScheduleInterviewAction({
  candidateId,
}: ScheduleInterviewActionProps) {
  const [interviewType, setInterviewType] = useState<InterviewType>("video");
  const { data: interviews, isPending: interviewsPending } = useInterviews({
    candidateId,
    limit: 50,
  });
  const createInterview = useCreateInterview();

  const candidateInterviews = interviews?.data ?? [];
  // React Query keeps a mutation's result until the component unmounts, so the
  // created interview is only trusted while the list has yet to mention it at
  // all — once the list knows about it, the list is the only source, and a
  // withdrawal (which lands there as `canceled`) is not overruled by this
  // now-stale snapshot.
  const created = createInterview.data;
  const pendingCreated =
    created &&
    isOpen(created) &&
    !candidateInterviews.some((interview) => interview.id === created.id)
      ? created
      : undefined;
  const openInterview = candidateInterviews.find(isOpen) ?? pendingCreated;

  if (openInterview) {
    return (
      <OpenInterviewActions
        key={openInterview.id}
        interview={openInterview}
        // Creating an interview is only ever step one of offering times, so the
        // form opens straight away rather than asking for a second click. Only
        // while it is still this component's own fresh creation, though: once
        // the list owns it, a remount means arriving at an interview whose
        // times may already have been offered.
        initialPanel={openInterview === pendingCreated ? "proposing" : "none"}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <NativeSelect
          aria-label="Interview type"
          value={interviewType}
          className="w-auto shrink-0"
          onChange={(event) => {
            // A native select's onChange only ever gives a string; parsing it
            // against the same schema the API layer validates with means an
            // unexpected DOM value is caught here instead of flowing into
            // the mutation's request body.
            const parsed = interviewTypeSchema.safeParse(event.target.value);
            if (parsed.success) setInterviewType(parsed.data);
          }}
        >
          {INTERVIEW_TYPES.map((type) => (
            <option key={type} value={type}>
              {INTERVIEW_TYPE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>
        <Button
          type="button"
          size="sm"
          disabled={interviewsPending || createInterview.isPending}
          onClick={() => createInterview.mutate({ candidateId, interviewType })}
        >
          {createInterview.isPending ? "Scheduling…" : "Schedule interview"}
        </Button>
      </div>
      {createInterview.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {createInterviewErrorMessage(createInterview.error)}
        </div>
      )}
    </div>
  );
}
