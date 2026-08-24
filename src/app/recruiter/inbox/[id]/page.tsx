"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import {
  CandidateAttachments,
  CandidateFields,
  CandidateForm,
  useCandidate,
  useDeleteCandidate,
  CANDIDATE_STATUS_LABELS,
} from "@/features/candidates";
import { Thread } from "@/features/conversations";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { NegotiationActionCards } from "@/shared/ui-components/data/NegotiationActionCards";
import { NegotiationStateBadges } from "@/shared/ui-components/data/NegotiationStateBadges";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { TwoColumnDetailLayout } from "@/shared/ui-components/layout/TwoColumnDetailLayout";
import type { CandidateStatus } from "@/features/candidates";

const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "text-[#92610C] bg-[#FBF3DF]",
  interviewing: "text-[#92610C] bg-[#FBF3DF]",
  offered: "text-[#17734E] bg-[#E7F4EC]",
  hired: "text-[#17734E] bg-[#E7F4EC]",
  passed: "bg-muted text-muted-foreground",
};

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
    return (
      <div className="h-96 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    );
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
      <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm">
        <CandidateForm
          jobId={candidate.jobId}
          candidate={candidate}
          onDone={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            {candidate.fullName}
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href={`mailto:${candidate.email}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </p>
        </div>
        <StatusBadge
          label={CANDIDATE_STATUS_LABELS[candidate.status]}
          className={CANDIDATE_STATUS_STYLES[candidate.status]}
        />
      </div>

      <NegotiationStateBadges
        interview={negotiationState?.interview ?? null}
        offer={negotiationState?.offer ?? null}
      />

      <NegotiationActionCards
        negotiationState={negotiationState}
        viewerParty="recruiter"
      />

      <CandidateFields candidate={candidate} />

      <CandidateAttachments candidateId={candidate.id} />

      <div className="border-t border-border/60 pt-3">
        {mode === "confirm-remove" ? (
          <ConfirmAction
            message="Remove this candidate? This cannot be undone."
            confirmLabel="Confirm remove"
            busyLabel="Removing…"
            busy={deleteCandidate.isPending}
            onCancel={() => setMode("view")}
            onConfirm={() => deleteCandidate.mutate(candidate.id)}
          />
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMode("edit")}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("confirm-remove")}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruiterCandidatePage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide="detail">
        {/* Keeps the candidate query and the conversation socket from ever
         * mounting for an unapproved recruiter — both live inside
         * `left`/`right` below, which `RequireApprovedRecruiter` swaps out
         * entirely rather than rendering hidden. */}
        <RequireApprovedRecruiter>
          <TwoColumnDetailLayout
            header={
              <div className="flex flex-col gap-6">
                <Link
                  href="/recruiter/inbox"
                  className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to inbox
                </Link>
                <PageHeader
                  title="Candidate"
                  subtitle="Your candidate, and the conversation with the company about them."
                />
              </div>
            }
            left={<CandidateDetailColumn candidateId={params.id} />}
            right={<Thread candidateId={params.id} />}
          />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
