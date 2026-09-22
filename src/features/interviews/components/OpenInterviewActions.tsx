"use client";

import { useState } from "react";
import { AlertCircle, CalendarClock } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useCancelInterview } from "../hooks/useInterviews";
import { INTERVIEW_TYPE_LABELS, type Interview } from "../schemas";
import { withdrawInterviewErrorMessage } from "../utils/interviewErrorMessages";
import { ProposedSlotList } from "./ProposedSlotList";
import { ProposeSlotsForm } from "./ProposeSlotsForm";
import { RecordOutcomeActions } from "./RecordOutcomeActions";

/** The panel replaces the buttons while it is open, so the three states are
 * exclusive by construction rather than by two booleans that could both be
 * true. */
type OpenInterviewPanel = "none" | "proposing" | "withdrawing";

export interface OpenInterviewActionsProps {
  /** The candidate's one interview that is still `proposed` or `scheduled`. */
  interview: Interview;
}

/** The agreed time, and the decision that closes the round. A scheduled
 * interview is exactly the point where an outcome becomes recordable, so the
 * two belong in one block rather than in separate panels the company has to
 * go looking for. */
function ScheduledInterview({ interview }: { interview: Interview }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-muted-foreground">
          {INTERVIEW_TYPE_LABELS[interview.interviewType]} interview · round{" "}
          {interview.round} · scheduled
        </p>
        {interview.confirmedSlotStart && interview.confirmedSlotEnd && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarClock
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            {formatDateTime(interview.confirmedSlotStart)} –{" "}
            {formatDateTime(interview.confirmedSlotEnd)}
          </p>
        )}
      </div>
      <RecordOutcomeActions interview={interview} />
    </div>
  );
}

/**
 * What a company can still do about an interview it has already opened for
 * this candidate: offer times for it, withdraw it, or — once a time is agreed
 * — record what came of it.
 *
 * Shows the open batch's times as well, so the rail never claims an interview
 * is "awaiting a time" without saying which times are on the table. Replacing
 * those times stays with the thread's `ProposalCard`, which already knows
 * which batch it supersedes; withdrawing is offered in both places because it
 * is the one way out of an interview from either view.
 *
 * Reuses `ProposeSlotsForm`, so the first batch of times is proposed through
 * exactly the same form as every later batch in the thread.
 */
export function OpenInterviewActions({ interview }: OpenInterviewActionsProps) {
  const [panel, setPanel] = useState<OpenInterviewPanel>("none");
  const cancelInterview = useCancelInterview(interview.id);

  if (interview.status === "scheduled") {
    return <ScheduledInterview interview={interview} />;
  }

  // A completed or canceled interview is history: it neither blocks a new one
  // nor can be acted on, so it gets no panel rather than the "awaiting a time"
  // copy below.
  if (interview.status !== "proposed") {
    return null;
  }

  const liveProposal = interview.liveProposal;

  if (panel === "proposing") {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
        <p className="text-sm font-medium text-foreground">
          Propose interview times
        </p>
        <ProposeSlotsForm
          target={{ kind: "existing", interviewId: interview.id }}
          onDone={() => setPanel("none")}
          onCancel={() => setPanel("none")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">
        {INTERVIEW_TYPE_LABELS[interview.interviewType]} interview · round{" "}
        {interview.round} ·{" "}
        {liveProposal ? "times proposed" : "awaiting a time"}
      </p>
      {liveProposal && <ProposedSlotList slots={liveProposal.slots} />}
      {panel === "withdrawing" ? (
        <ConfirmAction
          message="Withdraw this interview? This cancels it and cannot be undone."
          confirmLabel="Confirm withdraw"
          busyLabel="Withdrawing…"
          busy={cancelInterview.isPending}
          onCancel={() => setPanel("none")}
          // Closes itself rather than waiting to be unmounted once the parent's
          // list refetches: until then the destructive panel would sit there
          // re-enabled, inviting a second withdraw that can only 409.
          onConfirm={() =>
            cancelInterview.mutate(undefined, {
              onSuccess: () => setPanel("none"),
            })
          }
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {/* Replacing an open batch stays in the thread's `ProposalCard`,
              which already knows which batch it supersedes — only withdrawing
              is offered in both places. */}
          {!liveProposal && (
            <Button
              type="button"
              size="sm"
              onClick={() => setPanel("proposing")}
            >
              Propose times
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPanel("withdrawing")}
          >
            Withdraw
          </Button>
        </div>
      )}
      {cancelInterview.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {withdrawInterviewErrorMessage(cancelInterview.error)}
        </div>
      )}
    </div>
  );
}
