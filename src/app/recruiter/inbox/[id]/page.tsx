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
} from "@/features/candidates";
import { Thread, useMessageUnreadCounts } from "@/features/conversations";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { InboxConversationPane, InboxMessageWorkspace } from "@/features/inbox";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { Button } from "@/shared/ui-components/controls/button";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
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
          <button
            type="button"
            className="inline-flex h-7.5 items-center rounded-xs border border-bad-line px-2.5 text-[12.5px] font-semibold transition-colors hover:bg-bad/10"
            onClick={() => void onRetry()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The recruiter's mirror of the company's candidate pane: the same person,
 * plus the edit and remove controls only the submitting recruiter has.
 */
function CandidateDetailColumn({ candidateId }: { candidateId: string }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-remove">("view");
  const candidateQuery = useCandidate(candidateId);
  const deleteCandidate = useDeleteCandidate(candidateQuery.data?.jobId ?? "");
  const interviewsQuery = useInterviews({ candidateId, limit: 100 });
  const offersQuery = useOffers({ candidateId, limit: 100 });

  if (candidateQuery.isPending) {
    return <CandidateRailSkeleton />;
  }
  if (candidateQuery.isError) {
    return (
      <ErrorCallout
        message="Could not load this candidate."
        onRetry={() => void candidateQuery.refetch()}
      />
    );
  }

  const candidate = candidateQuery.data;
  // Read-only here, unlike the company card: shown once both lists resolve so
  // it never flashes "none yet" over a live offer.
  const negotiationState =
    interviewsQuery.data && offersQuery.data
      ? (candidateNegotiationState(
          interviewsQuery.data.data,
          offersQuery.data.data,
        ).get(candidateId) ?? null)
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

export default function RecruiterCandidatePage() {
  const params = useParams<{ id: string }>();
  const unreadCounts = useMessageUnreadCounts();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide="detail">
        {/* Keeps the candidate query and the conversation socket from ever
         * mounting for an unapproved recruiter — both live inside
         * `left`/`right` below, which `RequireApprovedRecruiter` swaps out
         * entirely rather than rendering hidden. */}
        <RequireApprovedRecruiter>
          <InboxMessageWorkspace
            backHref="/recruiter/inbox"
            list={
              <InboxConversationPane side="recruiter" selectedId={params.id} />
            }
            conversation={<Thread candidateId={params.id} />}
            candidate={<CandidateDetailColumn candidateId={params.id} />}
            candidateUnread={(unreadCounts.data?.get(params.id) ?? 0) > 0}
          />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
