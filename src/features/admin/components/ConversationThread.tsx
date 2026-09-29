"use client";

import {
  AlertCircle,
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Send,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { adminConversationPath } from "@/shared/utils/entityPaths";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminConversation } from "../hooks/useAdmin";
import {
  CANDIDATE_LABELS,
  type ConversationEvent,
  type ConversationThread as ConversationThreadPage,
} from "../schemas";
import { DetailSkeleton } from "./DetailPrimitives";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";

const EVENT_ICON: Record<ConversationEvent["type"], LucideIcon> = {
  submission: Send,
  candidate: UserPlus,
  proposal: CalendarClock,
  // Same scheduling icon as `proposal`: an `interview` entry is the same
  // scheduling thread reaching its end (canceled or completed), not a
  // separate concern.
  interview: CalendarClock,
  hire_response: CheckCircle2,
  offer: FileText,
  // Same neutral icon as `submission`: neither is tied to a specific outcome.
  message: Send,
  unknown: Send,
};

const ACTOR_LABEL: Record<string, string> = {
  company: "Company",
  recruiter: "Recruiter",
  system: "System",
};

/**
 * `.timeline__icon--*` — the actor's color is the only thing distinguishing one
 * entry from the next, and it matches the legend in the header card.
 */
const ACTOR_MARKER: Record<string, string> = {
  company: "bg-navy text-white",
  recruiter: "bg-blue text-white",
  system: "bg-neutral-bg text-neutral",
};

const ACTOR_TEXT: Record<string, string> = {
  company: "text-ink",
  recruiter: "text-blue",
  system: "text-ink-muted",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Pages arrive newest-first (same default as the participant thread).
 * Reversing the concatenation of every fetched page renders oldest-at-top
 * with the newest entry at the bottom, and each additional ("older") page
 * fetched via "Load older" lands above what is already on screen.
 */
function orderedEvents(pages: ConversationThreadPage[]): ConversationEvent[] {
  return pages.flatMap((page) => page.events.data).reverse();
}

export function ConversationThread({ candidateRef }: { candidateRef: string }) {
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminConversation(candidateRef);
  const candidate = data?.pages[0]?.candidate;
  useCanonicalPath(candidate && adminConversationPath(candidate));

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <div className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
          Could not load this conversation.
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const header = data.pages[0];
  const events = orderedEvents(data.pages);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3.5">
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-card font-[650] text-ink">
              {header.company.name}
            </span>
            <ArrowLeftRight className="size-[15px] text-ink-faint" />
            <span className="text-card font-[650] text-ink">
              {header.recruiter.name}
            </span>
            <StatusBadge
              className="ml-auto"
              label={
                CANDIDATE_LABELS[header.candidate.status] ??
                header.candidate.status
              }
              tone={
                CANDIDATE_STATUS_TONES[header.candidate.status] ?? "neutral"
              }
            />
          </div>
          <p className="text-sub text-ink-body">
            Candidate:{" "}
            <span className="font-[650] text-ink">
              {header.candidate.fullName}
            </span>{" "}
            · Role:{" "}
            <span className="font-[650] text-ink">{header.job.title}</span>
          </p>
          {/* The legend the timeline icons answer to. */}
          <div className="flex items-center gap-4 text-meta text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-navy" />
              Company
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue" />
              Recruiter
            </span>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardContent>
          {/* `.timeline` — a read-only audit trail: a 30px actor-colored icon
              over a hairline rail, with the entry's body beside it. */}
          <ol className="flex flex-col">
            {events.map((event, index) => {
              // Fall back to the neutral icon rather than throwing on a type
              // this map doesn't (yet) know about.
              const Icon = EVENT_ICON[event.type] ?? Send;
              const actor = event.actor ?? "system";
              const isLast = index === events.length - 1;
              const key =
                event.messageId ??
                `${event.type}-${event.at}-${event.candidateId ?? "none"}`;
              return (
                <li key={key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-7.5 shrink-0 items-center justify-center rounded-full",
                        ACTOR_MARKER[actor] ?? ACTOR_MARKER.system,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    {!isLast && (
                      <span className="my-1 w-[1.5px] flex-1 bg-line" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      isLast ? "pb-0" : "pb-[18px]",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-block font-[650] text-ink">
                        {event.title}
                      </p>
                      <span
                        className={cn(
                          "text-label font-[650] uppercase",
                          ACTOR_TEXT[actor] ?? "text-ink-muted",
                        )}
                      >
                        {ACTOR_LABEL[actor] ?? "System"}
                      </span>
                    </div>
                    <p className="mt-[3px] text-meta tabular-nums text-ink-faint">
                      {formatDateTime(event.at)}
                    </p>
                    {event.body && (
                      /* `.well` — the message itself, quoted rather than
                         restated in the entry's own voice. */
                      <p className="mt-1.5 rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-body text-ink-body">
                        {event.body}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
