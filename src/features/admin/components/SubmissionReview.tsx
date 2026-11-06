"use client";

import { useState } from "react";

import {
  CandidateDetailPanel,
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_TONES,
  useApproveCandidate,
  useDeclineCandidate,
  type Candidate,
} from "@/features/candidates";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";

/**
 * The submission as an admin reads it: the whole record, not a summary.
 *
 * Quality lives in the CV and the recruiter's pitch, not in a name and a
 * stage, and it is the same `CandidateDetailPanel` the recruiter and the
 * company see — an admin approving on a different rendering of the facts than
 * the two parties will read is how a reviewer approves something that looks
 * wrong to everyone else. The panel renders the attachments itself.
 */
export function SubmissionRecord({ candidate }: { candidate: Candidate }) {
  return (
    <CandidateDetailPanel
      candidate={candidate}
      // An admin judging quality reads the whole record, contact details
      // included — see the panel's own note.
      viewerParty="admin"
      stageLabel={CANDIDATE_STATUS_LABELS[candidate.status]}
      stageTone={CANDIDATE_STATUS_TONES[candidate.status]}
      negotiation={
        candidate.pitch ? (
          <div className="rounded-sm border border-line bg-surface-sub px-3 py-2.5">
            <p className="text-label font-[650] uppercase text-ink-muted">
              Recruiter&rsquo;s Pitch
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sub leading-relaxed text-ink-body">
              {candidate.pitch}
            </p>
          </div>
        ) : null
      }
    />
  );
}

/**
 * Approve, or reject with an optional note — a union rather than two booleans,
 * so "rejecting with the note box hidden" cannot be represented.
 */
type Mode = { kind: "reviewing" } | { kind: "rejecting"; reason: string };

export interface SubmissionDecisionProps {
  candidateId: string;
  /** Nothing to decide until the record has loaded. */
  disabled?: boolean;
  /** Lets a dialog close itself once the decision lands. */
  onDone?: () => void;
}

/**
 * The decision itself, so the dialog over the submissions table and the panel
 * on the conversation page offer exactly the same choice in the same words.
 *
 * The note is optional: most rejections are obvious from the record, and
 * making an admin type ten characters to say so only taught them to type
 * "wrong cv" — a required field nobody means is worse than an empty one.
 */
export function SubmissionDecision({
  candidateId,
  disabled = false,
  onDone,
}: SubmissionDecisionProps) {
  const [mode, setMode] = useState<Mode>({ kind: "reviewing" });
  const approve = useApproveCandidate();
  const decline = useDeclineCandidate();

  const busy = approve.isPending || decline.isPending;
  const done = (): void => {
    setMode({ kind: "reviewing" });
    onDone?.();
  };

  return (
    <div className="flex flex-col gap-3">
      {mode.kind === "rejecting" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reject-reason">
            Why are you rejecting this?{" "}
            <span className="font-[450] text-ink-muted">(Optional)</span>
          </Label>
          <Textarea
            id="reject-reason"
            rows={3}
            autoFocus
            placeholder="The CV is for a different role — please attach the right one."
            value={mode.reason}
            onChange={(event) =>
              setMode({ kind: "rejecting", reason: event.target.value })
            }
          />
          <p className="text-meta text-ink-muted">
            The recruiter sees this, so say what to fix if it is not obvious.
            The company is never told the submission was made.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {mode.kind === "reviewing" ? (
          <>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || disabled}
              onClick={() => setMode({ kind: "rejecting", reason: "" })}
            >
              Reject
            </Button>
            <Button
              type="button"
              disabled={busy || disabled}
              onClick={() => approve.mutate(candidateId, { onSuccess: done })}
            >
              {approve.isPending ? "Approving…" : "Approve"}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setMode({ kind: "reviewing" })}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                decline.mutate(
                  { id: candidateId, reason: mode.reason.trim() || undefined },
                  { onSuccess: done },
                )
              }
            >
              {decline.isPending ? "Rejecting…" : "Reject Submission"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
