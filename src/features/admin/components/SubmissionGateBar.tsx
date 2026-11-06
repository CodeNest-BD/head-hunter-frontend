"use client";

import type { ReactNode } from "react";
import { Clock3, XOctagon } from "lucide-react";

import type { Candidate } from "@/features/candidates";
import { formatDateTime } from "@/shared/utils/formatDate";

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
export function SubmissionGateBar({
  candidate,
  action,
}: {
  candidate: Candidate;
  /**
   * How to act on it, when acting is not already possible on the page. The
   * conversation page lays the record and the decision out beside the thread,
   * so there is nothing for the bar to offer; a split view with no room for
   * that passes the dialog instead.
   */
  action?: ReactNode;
}) {
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
        {action}
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
          Rejected
          {candidate.reviewedAt && (
            <span className="ml-1.5 font-[450] text-ink-muted">
              · {formatDateTime(candidate.reviewedAt)}
            </span>
          )}
        </p>
        {/* The note is optional, so most rejections have none — say that
            plainly rather than printing an empty paragraph. */}
        <p className="mt-1 whitespace-pre-wrap text-sub leading-relaxed text-ink-body">
          {candidate.reviewNote ?? "No note was left."}
        </p>
        <p className="mt-1.5 text-meta text-ink-muted">
          Sent back to the recruiter; the company was never told about this
          submission. It returns here if they fix it and resend.
        </p>
      </div>
    </div>
  );
}
