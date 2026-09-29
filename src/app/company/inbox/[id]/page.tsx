"use client";

import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import {
  CandidateCard,
  CandidateRailSkeleton,
  useCandidate,
  type Candidate,
} from "@/features/candidates";
import {
  Thread,
  ThreadSkeleton,
  useMessageUnreadCounts,
} from "@/features/conversations";
import { InboxConversationPane, InboxMessageWorkspace } from "@/features/inbox";
import { candidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { useInterviews } from "@/features/interviews";
import { useOffers } from "@/features/offers";
import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { inboxThreadPath } from "@/shared/utils/entityPaths";
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
function CandidateDetailColumn({ candidate }: { candidate: Candidate }) {
  const interviewsQuery = useInterviews({
    candidateId: candidate.id,
    limit: 100,
  });
  const offersQuery = useOffers({ candidateId: candidate.id, limit: 100 });

  // Interviews and offers gate the skeleton too: until they resolve,
  // `negotiationState` is empty, so every action would render enabled and a
  // click on a candidate who already has a live offer would earn a raw 409
  // instead of the readable reason those controls exist to give. `isPending`
  // is false on error, so a failure still degrades rather than sticking.
  if (interviewsQuery.isPending || offersQuery.isPending) {
    return <CandidateRailSkeleton />;
  }

  const negotiationState = candidateNegotiationState(
    interviewsQuery.data?.data ?? [],
    offersQuery.data?.data ?? [],
  );

  return (
    <CandidateCard
      candidate={candidate}
      negotiationState={negotiationState.get(candidate.id) ?? null}
      className="lg:h-full lg:overflow-y-auto"
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
  useCanonicalPath(candidate && inboxThreadPath("company", candidate));

  const retry = () => void candidateQuery.refetch();

  return (
    <InboxMessageWorkspace
      backHref="/company/inbox"
      list={<InboxConversationPane side="company" selectedId={candidate?.id} />}
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

export default function CandidateReviewPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <RequireApprovedCompany>
        <DashboardLayout wide="detail">
          <CandidateWorkspace candidateRef={params.id} />
        </DashboardLayout>
      </RequireApprovedCompany>
    </RequireRole>
  );
}
