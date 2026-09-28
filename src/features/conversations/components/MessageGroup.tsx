import { cn } from "@/shared/libs/shadCnConfig";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ConversationEvent } from "../schemas";
import { eventKey, type ConversationParty } from "../utils/groupEvents";
import { MessageBubble } from "./MessageBubble";

export interface MessageGroupProps {
  actor: ConversationParty;
  isOwn: boolean;
  events: ConversationEvent[];
  /** `threadHeader.company.name` / `threadHeader.recruiter.name` — the
   * actual name to show for this group instead of the shouted party word.
   * Falls back to the party word only when the header hasn't supplied a
   * name for it. */
  companyName?: string;
  recruiterName?: string;
}

const PARTY_FALLBACK_LABEL: Record<ConversationParty, string> = {
  company: "Company",
  recruiter: "Recruiter",
};

/**
 * One run of consecutive messages from the same side of the conversation:
 * exactly one name label above the run and one timestamp — the last
 * message's — below it, however many bubbles the run holds.
 */
export function MessageGroup({
  actor,
  isOwn,
  events,
  companyName,
  recruiterName,
}: MessageGroupProps) {
  const partyName = actor === "company" ? companyName : recruiterName;
  // `partyName` is a `z.string()` field and can legally be `""` — `??` would
  // let a blank label through, so an empty/whitespace-only name falls back
  // to the party word the same as a missing one.
  const label = isOwn
    ? "You"
    : partyName?.trim() || PARTY_FALLBACK_LABEL[actor];
  const lastEvent = events[events.length - 1];

  return (
    // `.msg` — a 78%-wide run, mirrored to the right for the viewer's own.
    <div
      className={cn(
        "flex max-w-[78%] gap-[9px]",
        isOwn ? "ml-auto flex-row-reverse" : "flex-row",
      )}
    >
      {/* The counterparty gets an avatar; the viewer's own run is simply
          right-aligned, matching the design's asymmetry. */}
      {!isOwn && <Avatar name={label} size="sm" />}
      <div
        className={cn(
          "flex min-w-0 flex-col",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col gap-1",
            isOwn ? "items-end" : "items-start",
          )}
        >
          {events.map((event) => (
            <MessageBubble key={eventKey(event)} event={event} isOwn={isOwn} />
          ))}
        </div>
        {/* `.msg__meta` — one name and one timestamp for the whole run. */}
        <div
          className={cn(
            "mt-[3px] flex items-baseline gap-1.5 text-[11px] text-ink-faint",
            isOwn && "flex-row-reverse",
          )}
        >
          <span className="font-[550]">{label}</span>
          <span className="tabular-nums">{formatDateTime(lastEvent.at)}</span>
        </div>
      </div>
    </div>
  );
}
