"use client";

import { Clock3, ShieldCheck, XOctagon } from "lucide-react";

import type { Candidate } from "@/features/candidates";
import { Button } from "@/shared/ui-components/controls/button";
import { formatDateTime } from "@/shared/utils/formatDate";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";

/**
 * The admin's half of the quality-control gate, wherever a single submission
 * is on screen.
 *
 * `ReviewStateNotice` is the recruiter's half and says the same two things
 * from the other side — waiting, or sent back with a reason. They stay
 * separate because the audiences need opposite verbs: a recruiter is told to
 * wait or to fix, an admin is handed the decision.
 *
 * Returns null at every other stage, so a candidate past the gate renders
 * nothing and the surrounding view reads exactly as it did before.
 */
export function SubmissionGateBar({ candidate }: { candidate: Candidate }) {
  if (candidate.status === "pending_review") {
    return (
      <div className="flex flex-wrap items-start gap-3 rounded-md border border-warn-line bg-warn-bg px-4 py-3">
        <Clock3
          aria-hidden="true"
          className="mt-0.5 size-[17px] shrink-0 text-warn"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sub font-[650] text-ink">Waiting On Your Review</p>
          <p className="mt-0.5 text-meta leading-[18px] text-ink-muted">
            {candidate.fullName} is held at the quality gate — the company
            cannot see this submission, and the recruiter cannot move it, until
            you approve it.
          </p>
        </div>
        <SubmissionReviewDialog
          candidateId={candidate.id}
          name={candidate.fullName}
          trigger={
            <Button
              type="button"
              size="sm"
              aria-label={`Review ${candidate.fullName}'s submission`}
            >
              <ShieldCheck aria-hidden="true" />
              Review Submission
            </Button>
          }
        />
      </div>
    );
  }

  if (candidate.status !== "declined") return null;

  return (
    <div className="flex items-start gap-3 rounded-md border border-bad-line bg-bad-bg px-4 py-3">
      <XOctagon
        aria-hidden="true"
        className="mt-0.5 size-[17px] shrink-0 text-bad"
      />
      <div className="min-w-0">
        <p className="text-sub font-[650] text-bad">
          Sent Back To The Recruiter
          {candidate.reviewedAt && (
            <span className="ml-1.5 font-[450] text-ink-muted">
              · {formatDateTime(candidate.reviewedAt)}
            </span>
          )}
        </p>
        {/* The reason is what the recruiter is acting on, so an admin
            re-opening this needs to read the same words they sent. */}
        <p className="mt-1 whitespace-pre-wrap text-sub leading-relaxed text-ink-body">
          {candidate.reviewNote ?? "No reason was recorded."}
        </p>
        <p className="mt-1.5 text-meta text-ink-muted">
          The company was never told about this submission. It returns here if
          the recruiter sends it back for review.
        </p>
      </div>
    </div>
  );
}
