"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { useAuth } from "@/features/auth";
import { Button } from "@/shared/ui-components/controls/button";
import {
  useConversationThread,
  useMarkThreadRead,
} from "../hooks/useConversation";
import { useConversationRealtime } from "../hooks/useConversationRealtime";
import type { ConversationEvent, ConversationThread } from "../schemas";
import { CandidateFilterChips } from "./CandidateFilterChips";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { SystemEvent } from "./SystemEvent";

export interface ThreadProps {
  submissionId: string;
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-2/3 animate-pulse rounded-2xl bg-muted"
        />
      ))}
    </div>
  );
}

/**
 * Pages arrive newest-first (the API's default `sortOrder`). Reversing the
 * concatenation of every fetched page renders oldest-at-top with the newest
 * message at the bottom, and each additional ("older") page fetched via
 * "Load older" lands above what is already on screen — exactly where older
 * history belongs.
 */
function orderedEvents(pages: ConversationThread[]): ConversationEvent[] {
  return pages.flatMap((page) => page.events.data).reverse();
}

/** This thread only ever mounts behind a company/recruiter `RequireRole`
 * gate, but `Role` also includes `admin` — default to `company` in that
 * unreachable case rather than widening every alignment check to a third
 * party. */
function useViewerParty(): "company" | "recruiter" {
  const { user } = useAuth();
  return user?.role === "recruiter" ? "recruiter" : "company";
}

export function Thread({ submissionId }: ThreadProps) {
  const viewerParty = useViewerParty();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const params = useMemo(
    () => (candidateId ? { candidateId } : {}),
    [candidateId],
  );
  const { status: realtimeStatus } = useConversationRealtime(submissionId);
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversationThread(submissionId, params, realtimeStatus);
  const markRead = useMarkThreadRead(submissionId);

  // Mark the counterparty's messages read on mount and whenever the thread
  // regains focus (e.g. switching back to this tab) — the same two moments a
  // reader is actually looking at the thread.
  useEffect(() => {
    markRead.mutate();
    const onFocus = (): void => markRead.mutate();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  if (isPending) {
    return <ThreadSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load this conversation.
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const threadHeader = data.pages[0];
  const candidates = threadHeader?.candidates ?? [];
  const events = orderedEvents(data.pages);
  const selectedCandidate = candidates.find((c) => c.id === candidateId);
  // The counterparty is whoever the viewer isn't — a recruiter talks with the
  // company, and vice versa.
  const counterpartyName =
    viewerParty === "recruiter"
      ? threadHeader?.company.name
      : threadHeader?.recruiter.name;

  return (
    <div className="flex flex-col gap-4">
      {threadHeader && (
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Conversation with {counterpartyName} about {threadHeader.job.title}
        </h2>
      )}

      <CandidateFilterChips
        candidates={candidates}
        selectedCandidateId={candidateId}
        onSelect={setCandidateId}
      />

      {hasNextPage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-center"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {isFetchingNextPage ? "Loading…" : "Load older"}
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet — start the conversation about this role. You
            don&apos;t need to submit a candidate first.
          </p>
        )}
        {events.map((event) =>
          event.type === "message" ? (
            <MessageBubble
              key={event.messageId ?? `${event.type}-${event.at}`}
              event={event}
              viewerParty={viewerParty}
            />
          ) : (
            <SystemEvent
              key={`${event.type}-${event.at}-${event.candidateId ?? "none"}`}
              event={event}
            />
          ),
        )}
      </div>

      <MessageComposer
        submissionId={submissionId}
        candidateId={candidateId ?? undefined}
        candidateName={selectedCandidate?.fullName}
      />
    </div>
  );
}
