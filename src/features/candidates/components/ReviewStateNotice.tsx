"use client";

import { Clock3, RotateCcw, XOctagon } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useResubmitCandidate } from "../hooks/useCandidates";
import type { Candidate } from "../schemas";

/**
 * What the quality-control gate has to say to the recruiter who submitted.
 *
 * Only ever rendered on their own panel: the hiring company cannot see a
 * candidate at either of these stages at all, so there is no viewer check to
 * make here — the API would not have returned the candidate.
 *
 * Returns null at every other stage, so a candidate past the gate shows
 * nothing and the panel reads exactly as it did before. That also makes it
 * safe to mount unconditionally, which matters: a rejection is the one thing
 * on this panel the recruiter has to act on, and it must not wait on the
 * interview and offer queries that surround it.
 */
export function ReviewStateNotice({ candidate }: { candidate: Candidate }) {
  const resubmit = useResubmitCandidate();

  if (candidate.status === "pending_review") {
    return (
      <div className="flex items-start gap-2.5 rounded-sm border border-line bg-surface-sub px-3 py-2.5">
        <Clock3
          aria-hidden="true"
          className="mt-0.5 size-[15px] shrink-0 text-ink-muted"
        />
        <div className="min-w-0">
          <p className="text-sub font-[650] text-ink">
            Waiting on a quality check
          </p>
          <p className="mt-0.5 text-meta leading-[18px] text-ink-muted">
            An admin reviews every submission before the company sees it. You
            can still edit this candidate while it waits.
          </p>
        </div>
      </div>
    );
  }

  if (candidate.status !== "declined") return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-sm border border-bad-line bg-bad-bg px-3 py-3">
      <div className="flex items-start gap-2.5">
        <XOctagon
          aria-hidden="true"
          className="mt-0.5 size-[15px] shrink-0 text-bad"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sub font-[650] text-bad">
            Rejected by an admin
            {candidate.reviewedAt && (
              <span className="ml-1.5 font-[450] text-ink-muted">
                · {formatDateTime(candidate.reviewedAt)}
              </span>
            )}
          </p>

          {candidate.reviewNote ? (
            <>
              <p className="mt-2 text-label font-[650] uppercase text-ink-muted">
                What To Fix
              </p>
              {/* Quoted on its own surface rather than run into the notice:
                  these are someone else's words, they are the only thing here
                  that tells the recruiter what to do, and a note of several
                  lines has to stay readable. */}
              <blockquote className="mt-1 whitespace-pre-wrap break-words rounded-sm border-l-2 border-bad bg-surface px-3 py-2 text-sub leading-relaxed text-ink-body">
                {candidate.reviewNote}
              </blockquote>
            </>
          ) : (
            // The note is optional, so most rejections arrive without one.
            // Say that plainly and still say what to do next, rather than
            // leaving the recruiter staring at a verdict with no instruction.
            <p className="mt-1.5 text-sub leading-relaxed text-ink-body">
              No note was left. Check the CV and the details against the role,
              then send it back.
            </p>
          )}

          <p className="mt-2 text-meta leading-[18px] text-ink-muted">
            The company was never told about this submission, so nothing is lost
            — edit the candidate and resubmit when it is ready.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={resubmit.isPending}
          onClick={() => resubmit.mutate(candidate.id)}
        >
          <RotateCcw aria-hidden="true" />
          {resubmit.isPending ? "Sending…" : "Resubmit for review"}
        </Button>
      </div>
    </div>
  );
}
