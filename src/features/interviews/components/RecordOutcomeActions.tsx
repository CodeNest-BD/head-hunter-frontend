"use client";

import { useId, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { useRecordOutcome } from "../hooks/useInterviews";
import {
  INTERVIEW_OUTCOME_LABELS,
  MAX_PASS_FEEDBACK_LENGTH,
  type Interview,
} from "../schemas";
import { recordOutcomeErrorMessage } from "../utils/interviewErrorMessages";

/** Passing is the one outcome that carries data, so it is a panel rather than
 * a third button — and the feedback lives in the panel's own state, which
 * makes "passed with no feedback" unrepresentable here the same way the
 * backend's CHECK constraint makes it unrepresentable in the table. */
type OutcomePanel =
  | { kind: "choosing" }
  | { kind: "passing"; feedback: string };

export interface RecordOutcomeActionsProps {
  /** The candidate's `scheduled` interview — the only status with an outcome
   * still to record. */
  interview: Interview;
}

/**
 * How a round closes. `Next round` is what makes a multi-round process
 * possible: it completes this interview while leaving the candidate
 * `interviewing`, which lifts the one-open-interview rule and lets
 * `ScheduleInterviewAction` offer round N+1.
 */
export function RecordOutcomeActions({ interview }: RecordOutcomeActionsProps) {
  const [panel, setPanel] = useState<OutcomePanel>({ kind: "choosing" });
  const feedbackHintId = useId();
  const recordOutcome = useRecordOutcome(interview.id);

  const error = recordOutcome.isError && (
    <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {recordOutcomeErrorMessage(recordOutcome.error)}
    </div>
  );

  if (panel.kind === "passing") {
    const feedback = panel.feedback.trim();
    return (
      <div className="flex flex-col gap-2">
        <p id={feedbackHintId} className="text-xs text-muted-foreground">
          The recruiter sees this — it is the only word they get that their
          candidate is out.
        </p>
        <Textarea
          value={panel.feedback}
          onChange={(event) =>
            setPanel({ kind: "passing", feedback: event.target.value })
          }
          maxLength={MAX_PASS_FEEDBACK_LENGTH}
          placeholder="Strong on system design, weak on communication…"
          aria-label="Why this candidate is not moving forward"
          aria-describedby={feedbackHintId}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={feedback.length === 0 || recordOutcome.isPending}
            onClick={() =>
              recordOutcome.mutate({ outcome: "pass", passFeedback: feedback })
            }
          >
            {recordOutcome.isPending ? "Passing…" : "Confirm pass"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={recordOutcome.isPending}
            onClick={() => setPanel({ kind: "choosing" })}
          >
            Cancel
          </Button>
        </div>
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        Record Outcome
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={recordOutcome.isPending}
          onClick={() => recordOutcome.mutate({ outcome: "offer" })}
        >
          {INTERVIEW_OUTCOME_LABELS.offer}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={recordOutcome.isPending}
          onClick={() => recordOutcome.mutate({ outcome: "next_round" })}
        >
          {INTERVIEW_OUTCOME_LABELS.next_round}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={recordOutcome.isPending}
          onClick={() => setPanel({ kind: "passing", feedback: "" })}
        >
          {INTERVIEW_OUTCOME_LABELS.pass}
        </Button>
      </div>
      {error}
    </div>
  );
}
