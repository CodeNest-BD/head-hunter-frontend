"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/libs/shadCnConfig";
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
import { OfferCard } from "./OfferCard";
import { ProposalCard } from "./ProposalCard";
import { SystemEvent } from "./SystemEvent";

export interface ThreadProps {
  submissionId: string;
}

/**
 * Fixed-height card so the thread scrolls independently of whatever sits
 * beside or above it, instead of growing with every message and pushing the
 * rest of the page down. `lg:h-[calc(100vh-10rem)]` mirrors
 * `DashboardLayout`'s own `pt-24`/`pb-16` main padding (6rem + 4rem), so the
 * panel fills the space between the fixed header and the bottom of the
 * viewport when this column is sticky. The fixed `h-[32rem]` fallback keeps
 * the same "usefully tall" scroll area on narrow screens, where the column
 * stacks rather than stays sticky.
 */
const THREAD_PANEL_CLASSNAME =
  "flex h-[32rem] flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm lg:h-[calc(100vh-10rem)]";

function ThreadSkeleton() {
  return (
    <div className={THREAD_PANEL_CLASSNAME}>
      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-2/3 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
      <div className="h-20 w-full animate-pulse rounded-md bg-muted" />
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
      <div
        className={cn(
          THREAD_PANEL_CLASSNAME,
          "items-center justify-center border-destructive/40 bg-destructive/10 text-sm text-destructive",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-[18px] w-[18px]" />
            Could not load this conversation.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
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
    <div className={THREAD_PANEL_CLASSNAME}>
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

      {/* The only child allowed to shrink (`min-h-0`) inside the fixed-height
       * panel, so this is what scrolls — the header, chips, "load older" and
       * composer above/below stay in place. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-navy pr-1">
        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet — start the conversation about this role. You
            don&apos;t need to submit a candidate first.
          </p>
        )}
        {events.map((event) => {
          const key = `${event.type}-${event.at}-${event.candidateId ?? "none"}`;
          if (event.type === "message") {
            return (
              <MessageBubble
                key={event.messageId ?? key}
                event={event}
                viewerParty={viewerParty}
              />
            );
          }
          // A proposal event with no recognised `data.kind` — null, or a
          // kind this client predates — falls through to the plain
          // SystemEvent rendering below rather than crashing or being
          // dropped from the thread.
          if (event.type === "proposal" && event.data?.kind === "proposal") {
            return (
              <ProposalCard
                key={key}
                title={event.title}
                note={event.body}
                data={event.data}
                viewerParty={viewerParty}
              />
            );
          }
          // Same fallback reasoning as the proposal branch above: an offer
          // event with `data` null or of an unrecognised kind renders plainly
          // instead of being dropped.
          if (event.type === "offer" && event.data?.kind === "offer") {
            return (
              <OfferCard key={key} data={event.data} viewerParty={viewerParty} />
            );
          }
          return <SystemEvent key={key} event={event} />;
        })}
      </div>

      <MessageComposer
        submissionId={submissionId}
        candidateId={candidateId ?? undefined}
        candidateName={selectedCandidate?.fullName}
      />
    </div>
  );
}
