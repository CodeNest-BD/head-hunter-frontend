"use client";

import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { CandidateCard, useCandidate } from "@/features/candidates";
import { Thread } from "@/features/conversations";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { TwoColumnDetailLayout } from "@/shared/ui-components/layout/TwoColumnDetailLayout";

/**
 * Matches the shape of the loaded left column so the page doesn't reflow when
 * the candidate and negotiation queries resolve.
 */
function LeftColumnSkeleton() {
  return (
    <div className="h-96 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
  );
}

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
 * The left column: this one candidate, with the status control and the
 * interview/offer actions their negotiation state allows.
 *
 * Interviews and offers are fetched scoped to the candidate — two requests,
 * not one pair per card, now that a page holds exactly one candidate. A
 * failure on either is not fatal: the card and its status control stay usable
 * and every badge degrades to "none yet", rather than blocking the column the
 * way a failed candidate fetch does.
 */
function CandidateDetailColumn({ candidateId }: { candidateId: string }) {
  const candidateQuery = useCandidate(candidateId);
  const interviewsQuery = useInterviews({ candidateId, limit: 100 });
  const offersQuery = useOffers({ candidateId, limit: 100 });

  // Interviews and offers gate the skeleton too: until they resolve,
  // `negotiationState` is empty, so every action would render enabled and a
  // click on a candidate who already has a live offer would earn a raw 409
  // instead of the readable reason those controls exist to give. `isPending`
  // is false on error, so a failure still degrades rather than sticking.
  if (
    candidateQuery.isPending ||
    interviewsQuery.isPending ||
    offersQuery.isPending
  ) {
    return <LeftColumnSkeleton />;
  }
  if (candidateQuery.isError) {
    return (
      <ErrorCallout
        message="Could not load this candidate."
        onRetry={() => void candidateQuery.refetch()}
      />
    );
  }

  const negotiationState = candidateNegotiationState(
    interviewsQuery.data?.data ?? [],
    offersQuery.data?.data ?? [],
  );

  return (
    <CandidateCard
      candidate={candidateQuery.data}
      negotiationState={negotiationState.get(candidateId) ?? null}
    />
  );
}

export default function CandidateReviewPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <RequireApprovedCompany>
        <DashboardLayout wide="detail">
          <TwoColumnDetailLayout
            header={
              <PageHeader
                title="Review candidate"
                subtitle="Everything about this candidate, and the conversation about them."
              />
            }
            left={<CandidateDetailColumn candidateId={params.id} />}
            right={<Thread candidateId={params.id} />}
          />
        </DashboardLayout>
      </RequireApprovedCompany>
    </RequireRole>
  );
}
