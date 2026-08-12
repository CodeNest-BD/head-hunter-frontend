"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import {
  eventKey,
  groupEvents,
  type ConversationParty,
} from "../utils/groupEvents";
import { CandidateFilterChips } from "./CandidateFilterChips";
import { DaySeparator } from "./DaySeparator";
import { MessageComposer } from "./MessageComposer";
import { MessageGroup } from "./MessageGroup";
import { OfferCard } from "./OfferCard";
import { ProposalCard } from "./ProposalCard";
import { SystemEvent } from "./SystemEvent";

export interface ThreadProps {
  submissionId: string;
}

/**
 * Fixed-height card so the thread scrolls independently of whatever sits
 * beside or above it, instead of growing with every message and pushing the
 * rest of the page down. `lg:h-full` fills exactly the space
 * `TwoColumnDetailLayout` computes for this column via flex — that layout
 * (not a viewport `calc()` guessed here) is what keeps this panel, and its
 * composer, inside the viewport regardless of how tall the page's own
 * header block is. The fixed `h-[32rem]` fallback keeps the same "usefully
 * tall" scroll area on narrow screens, where the column stacks instead of
 * sitting beside the left column.
 */
const THREAD_PANEL_CLASSNAME =
  "flex h-[32rem] flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm lg:h-full";

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
function useViewerParty(): ConversationParty {
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

  // A fresh array every render regardless of whether the underlying data
  // changed (`orderedEvents` always allocates), so this is memoised on
  // `data` — both effects below and the render read the same array instead
  // of each recomputing it.
  const events = useMemo(() => (data ? orderedEvents(data.pages) : []), [data]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Set right before "Load older" fetches an older page, holding the scroll
  // container's height at that moment; cleared once consumed.
  const pendingOlderPageScrollHeightRef = useRef<number | null>(null);
  const lastEventKeyRef = useRef<string | undefined>(undefined);
  // The scroll container element this thread last scrolled for. A
  // candidate-chip switch or an error→Retry both unmount and remount this
  // `div` (via the `ThreadSkeleton`/error branches below) without
  // necessarily changing the newest event — an untagged system event is
  // often still the newest entry after narrowing to one candidate — so the
  // element's own identity is tracked as a second, independent trigger
  // rather than folded into "did the newest event change".
  const lastScrolledContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Scrolls to the newest message on first load, whenever the newest event
  // actually changes (a real arrival — Realtime or the periodic poll), and
  // whenever the scroll container itself has been replaced by a remount —
  // a fresh `div` always starts at `scrollTop 0`, so without this a
  // candidate-chip switch or an error→Retry re-opens the panel scrolled to
  // the top even though the "newest event" signal alone stayed silent.
  // Fetching an older page only ever appends to `data.pages`, and
  // `orderedEvents` reverses that into oldest-first, so the *last* (newest)
  // event's key is unchanged and this stays a no-op for that case.
  //
  // Deliberately has no dependency array: every comparison below is
  // idempotent (only a real change to the event key or the container
  // element ever touches `scrollTop`), so re-running it on every render is
  // a few reference checks, not a visible jump — and it means a remount
  // is caught the instant it happens rather than depending on `data`
  // reference equality also having changed in the same commit, which is
  // exactly the case a chip switch onto an untagged system event violates.
  // A layout effect, not a passive one, so the adjustment lands before the
  // browser paints the container at its stale `scrollTop 0`.
  useLayoutEffect(() => {
    const lastEvent = events[events.length - 1];
    const lastEventKey = lastEvent ? eventKey(lastEvent) : undefined;
    const container = scrollContainerRef.current;
    const eventChanged = lastEventKey !== lastEventKeyRef.current;
    const containerChanged = container !== lastScrolledContainerRef.current;
    lastEventKeyRef.current = lastEventKey;
    if (!container || (!eventChanged && !containerChanged)) return;
    lastScrolledContainerRef.current = container;
    container.scrollTop = container.scrollHeight;
  });

  // Compensates for "Load older": the click handler below records the
  // scroll height just before the fetch, and once the older page has
  // rendered above what's on screen, this adds back exactly that much
  // height to `scrollTop` — keeping the reader on the same message instead
  // of letting the newly prepended content push it down. No dependency
  // array for the same reason as the effect above: the ref itself (set only
  // by "Load older") is what gates the work, so running the check every
  // render costs nothing extra and can't miss a commit.
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const previousScrollHeight = pendingOlderPageScrollHeightRef.current;
    if (!container || previousScrollHeight === null) return;
    container.scrollTop += container.scrollHeight - previousScrollHeight;
    pendingOlderPageScrollHeightRef.current = null;
  });

  const handleLoadOlder = (): void => {
    const container = scrollContainerRef.current;
    if (container) {
      pendingOlderPageScrollHeightRef.current = container.scrollHeight;
    }
    // TanStack Query swallows a rejected `fetchNextPage` internally
    // (`.catch(noop)`) unless `throwOnError` is set, so a `.catch` here
    // never runs — the result must be read from the resolved value instead,
    // or a failed fetch leaves this ref set and a later, unrelated data
    // change applies a stale compensation.
    void fetchNextPage().then((result) => {
      if (result.isError) {
        pendingOlderPageScrollHeightRef.current = null;
      }
    });
  };

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
  const groupedItems = groupEvents(events, viewerParty);
  const selectedCandidate = candidates.find((c) => c.id === candidateId);
  // The counterparty is whoever the viewer isn't — a recruiter talks with the
  // company, and vice versa.
  const counterpartyName =
    viewerParty === "recruiter"
      ? threadHeader?.company.name
      : threadHeader?.recruiter.name;
  const counterpartyFallback =
    viewerParty === "recruiter" ? "Company" : "Recruiter";
  // `counterpartyName` is a `z.string()` field and can legally be `""` —
  // `??` would let a blank heading through, so an empty/whitespace-only
  // name falls back the same as a missing one.
  const counterpartyHeading = counterpartyName?.trim() || counterpartyFallback;

  return (
    <div className={THREAD_PANEL_CLASSNAME}>
      {threadHeader && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {counterpartyHeading}
          </h2>
          <p className="text-sm text-muted-foreground">
            {threadHeader.job.title}
          </p>
        </div>
      )}

      <CandidateFilterChips
        candidates={candidates}
        selectedCandidateId={candidateId}
        onSelect={setCandidateId}
      />

      {/* The only child allowed to shrink (`min-h-0`) inside the
       * fixed-height panel, so this is what scrolls — the header, chips and
       * composer above/below stay in place. `overflow-anchor:none` turns off
       * the browser's own scroll-anchoring (on by default in Chrome/Firefox)
       * for this container: that feature also adjusts `scrollTop` when
       * content is inserted above the anchor node, which would double the
       * manual "Load older" compensation above and jump the reader down by
       * a whole page. jsdom cannot model scroll anchoring, so this can't be
       * proven by a test — disabling it removes the risk outright instead
       * of leaving it unverified. */}
      <div
        ref={scrollContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-navy pr-1 [overflow-anchor:none]"
      >
        {hasNextPage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-center"
            disabled={isFetchingNextPage}
            onClick={handleLoadOlder}
          >
            {isFetchingNextPage ? "Loading…" : "Load older"}
          </Button>
        )}
        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet — start the conversation about this role. You
            don&apos;t need to submit a candidate first.
          </p>
        )}
        {groupedItems.map((item) => {
          if (item.kind === "day") {
            return <DaySeparator key={`day-${item.date}`} date={item.date} />;
          }

          if (item.kind === "messages") {
            return (
              <MessageGroup
                key={`group-${eventKey(item.events[0])}`}
                actor={item.actor}
                isOwn={item.isOwn}
                events={item.events}
                companyName={threadHeader?.company.name}
                recruiterName={threadHeader?.recruiter.name}
              />
            );
          }

          const event = item.event;
          const key = eventKey(event);
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
              <OfferCard
                key={key}
                data={event.data}
                viewerParty={viewerParty}
              />
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
