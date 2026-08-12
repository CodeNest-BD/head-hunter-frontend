import { cn } from "@/shared/libs/shadCnConfig";
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
    <div
      className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
    >
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex w-full flex-col gap-1">
        {events.map((event) => (
          <div
            key={eventKey(event)}
            className={cn("flex", isOwn ? "justify-end" : "justify-start")}
          >
            <MessageBubble event={event} isOwn={isOwn} />
          </div>
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {formatDateTime(lastEvent.at)}
      </span>
    </div>
  );
}
