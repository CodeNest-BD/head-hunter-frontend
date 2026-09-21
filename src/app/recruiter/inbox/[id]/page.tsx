"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import {
  CandidateAttachments,
  CandidateFields,
  CandidateForm,
  CandidateRailSkeleton,
  useCandidate,
  useDeleteCandidate,
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_STYLES,
} from "@/features/candidates";
import { Thread, useMessageUnreadCounts } from "@/features/conversations";
import { InboxConversationPane, InboxMessageWorkspace } from "@/features/inbox";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
function ErrorCallout({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-[18px] w-[18px] shrink-0" />
        {message}
      </div>
      {onRetry && (
        <div>
          <button
            type="button"
            className="rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
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
  const interviewsQuery = useInterviews({ candidateId, limit: 100 });
  const offersQuery = useOffers({ candidateId, limit: 100 });
  const deleteCandidate = useDeleteCandidate(candidateQuery.data?.jobId ?? "");

  if (
    candidateQuery.isPending ||
    interviewsQuery.isPending ||
    offersQuery.isPending
  ) {
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
  const negotiationState =
    candidateNegotiationState(
      interviewsQuery.data?.data ?? [],
      offersQuery.data?.data ?? [],
    ).get(candidateId) ?? null;

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm lg:h-full lg:overflow-y-auto">
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
    <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-card p-5 shadow-sm lg:h-full lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            {candidate.fullName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            <a
              href={`mailto:${candidate.email}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </p>
        </div>
        {/* Record actions live in the header, next to the status — not
            stranded in a footer. Remove is destructive (red on hover) and
            still goes through the confirm below. */}
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge
            label={CANDIDATE_STATUS_LABELS[candidate.status]}
            className={CANDIDATE_STATUS_STYLES[candidate.status]}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Edit candidate"
            onClick={() => setMode("edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove candidate"
            aria-pressed={mode === "confirm-remove"}
            onClick={() =>
              setMode((current) =>
                current === "confirm-remove" ? "view" : "confirm-remove",
              )
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mode === "confirm-remove" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <ConfirmAction
            message="Remove this candidate? This cannot be undone."
            confirmLabel="Confirm remove"
            busyLabel="Removing…"
            busy={deleteCandidate.isPending}
            onCancel={() => setMode("view")}
            onConfirm={() => deleteCandidate.mutate(candidate.id)}
          />
        </div>
      )}

      {/* Read-only status. The recruiter accepts, declines or counters a
          live offer — and confirms or counters interview times — on the
          actionable cards in the conversation thread beside this rail. */}
      <NegotiationStateBadges
        interview={negotiationState?.interview ?? null}
        offer={negotiationState?.offer ?? null}
      />

      <CandidateFields candidate={candidate} />

      <CandidateAttachments candidateId={candidate.id} />
    </div>
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
