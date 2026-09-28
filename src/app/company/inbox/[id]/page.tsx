"use client";

import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import {
  CandidateCard,
  CandidateRailSkeleton,
  useCandidate,
} from "@/features/candidates";
import { Thread, useMessageUnreadCounts } from "@/features/conversations";
import { InboxConversationPane, InboxMessageWorkspace } from "@/features/inbox";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { Button } from "@/shared/ui-components/controls/button";

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

  const negotiationState = candidateNegotiationState(
    interviewsQuery.data?.data ?? [],
    offersQuery.data?.data ?? [],
  );

  return (
    <CandidateCard
      candidate={candidateQuery.data}
      negotiationState={negotiationState.get(candidateId) ?? null}
      className="lg:h-full lg:overflow-y-auto"
    />
  );
}

export default function CandidateReviewPage() {
  const params = useParams<{ id: string }>();
  const unreadCounts = useMessageUnreadCounts();

  return (
    <RequireRole role="company">
      <RequireApprovedCompany>
        <DashboardLayout wide="detail">
          <InboxMessageWorkspace
            backHref="/company/inbox"
            list={
              <InboxConversationPane side="company" selectedId={params.id} />
            }
            conversation={<Thread candidateId={params.id} />}
            candidate={<CandidateDetailColumn candidateId={params.id} />}
            candidateUnread={(unreadCounts.data?.get(params.id) ?? 0) > 0}
          />
        </DashboardLayout>
      </RequireApprovedCompany>
    </RequireRole>
  );
}
