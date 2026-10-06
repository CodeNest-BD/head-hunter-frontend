"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import {
  CandidateDetailPanel,
  CandidateForm,
  CandidateRailSkeleton,
  useCandidate,
  useDeleteCandidate,
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_TONES,
  type Candidate,
} from "@/features/candidates";
import {
  Thread,
  ThreadSkeleton,
  useMessageUnreadCounts,
} from "@/features/conversations";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { InboxConversationPane, InboxMessageWorkspace } from "@/features/inbox";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { Button } from "@/shared/ui-components/controls/button";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { inboxThreadPath } from "@/shared/utils/entityPaths";
function ErrorCallout({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-4 text-sub text-bad">
      <div className="flex items-center gap-2 font-[650]">
        <AlertCircle className="size-[15px] shrink-0" />
        {message}
      </div>
      {onRetry && (
        <div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void onRetry()}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * The recruiter's mirror of the company's candidate pane: the same person,
 * plus the edit and remove controls only the submitting recruiter has.
 */
function CandidateDetailColumn({ candidate }: { candidate: Candidate }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-remove">("view");
  const deleteCandidate = useDeleteCandidate(candidate.jobId);
  const interviewsQuery = useInterviews({
    candidateId: candidate.id,
    limit: 100,
  });
  const offersQuery = useOffers({ candidateId: candidate.id, limit: 100 });

  // Read-only here, unlike the company card: shown once both lists resolve so
  // it never flashes "none yet" over a live offer.
  const negotiationState =
    interviewsQuery.data && offersQuery.data
      ? (candidateNegotiationState(
          interviewsQuery.data.data,
          offersQuery.data.data,
        ).get(candidate.id) ?? null)
      : undefined;

  // Once the company starts reviewing, the details it is judging must hold
  // still — the API refuses edits and removal past this point too.
  const canManageCandidate = candidate.status === "submitted";

  if (mode === "edit" && canManageCandidate) {
    return (
      <div className="rounded-md border border-line bg-surface p-4 shadow-e1 lg:h-full lg:overflow-y-auto">
        <CandidateForm
          jobId={candidate.jobId}
          candidate={candidate}
          dense
          onDone={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <CandidateDetailPanel
      candidate={candidate}
      stageLabel={CANDIDATE_STATUS_LABELS[candidate.status]}
      stageTone={CANDIDATE_STATUS_TONES[candidate.status]}
      negotiation={
        negotiationState !== undefined ? (
          <NegotiationStateBadges
            interview={negotiationState?.interview ?? null}
            offer={negotiationState?.offer ?? null}
            viewerParty="recruiter"
          />
        ) : null
      }
      headerActions={
        canManageCandidate && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Edit candidate"
              onClick={() => setMode("edit")}
            >
              <Pencil aria-hidden="true" className="size-[15px]" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 hover:bg-bad-bg hover:text-bad"
              aria-label="Remove candidate"
              aria-pressed={mode === "confirm-remove"}
              onClick={() =>
                setMode((current) =>
                  current === "confirm-remove" ? "view" : "confirm-remove",
                )
              }
            >
              <Trash2 aria-hidden="true" className="size-[15px]" />
            </Button>
          </>
        )
      }
      banner={
        mode === "confirm-remove" && canManageCandidate ? (
          <div className="rounded-sm border border-bad-line bg-bad-bg p-3">
            <ConfirmAction
              message="Remove this candidate? This cannot be undone."
              confirmLabel="Confirm remove"
              busyLabel="Removing…"
              busy={deleteCandidate.isPending}
              onCancel={() => setMode("view")}
              onConfirm={() => deleteCandidate.mutate(candidate.id)}
            />
          </div>
        ) : null
      }
    />
  );
}

/**
 * The URL carries the candidate's serial, but the thread, its mark-read, the
 * realtime match and every UUID-keyed map below need the UUID — so the
 * candidate is read first and everything past it uses `candidate.id`.
 */
function CandidateWorkspace({ candidateRef }: { candidateRef: string }) {
  const candidateQuery = useCandidate(candidateRef);
  const unreadCounts = useMessageUnreadCounts();
  const candidate = candidateQuery.data;
  useCanonicalPath(candidate && inboxThreadPath("recruiter", candidate));

  const retry = () => void candidateQuery.refetch();

  return (
    <InboxMessageWorkspace
      backHref="/recruiter/inbox"
      list={
        <InboxConversationPane side="recruiter" selectedId={candidate?.id} />
      }
      conversation={
        candidate ? (
          <Thread candidateId={candidate.id} />
        ) : candidateQuery.isError ? (
          <ErrorCallout
            message="Could not load this conversation."
            onRetry={retry}
          />
        ) : (
          <ThreadSkeleton />
        )
      }
      candidate={
        candidateQuery.isError ? (
          <ErrorCallout
            message="Could not load this candidate."
            onRetry={retry}
          />
        ) : candidate ? (
          <CandidateDetailColumn candidate={candidate} />
        ) : (
          <CandidateRailSkeleton />
        )
      }
      candidateUnread={
        candidate !== undefined &&
        (unreadCounts.data?.get(candidate.id) ?? 0) > 0
      }
    />
  );
}

export default function RecruiterCandidatePage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide="detail">
        {/* Keeps the candidate query and the conversation socket from ever
         * mounting for an unapproved recruiter — both live inside
         * `CandidateWorkspace`, which `RequireApprovedRecruiter` swaps out
         * entirely rather than rendering hidden. */}
        <RequireApprovedRecruiter>
          <CandidateWorkspace candidateRef={params.id} />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
