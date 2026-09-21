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

const AVATAR_PALETTE = [
  "bg-[#E8EDFB] text-[#3F5BA9]",
  "bg-[#FBF1DC] text-[#8A6D3B]",
  "bg-[#E7F0E9] text-[#3F7A5A]",
  "bg-[#F2E9F3] text-[#7A4F86]",
  "bg-[#FBE9E6] text-[#9B4A3F]",
];
function avatarTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
      className={cn("flex gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}
    >
      {/* The counterparty gets an avatar; the viewer's own run is simply
          right-aligned, matching the design's asymmetry. */}
      {!isOwn && (
        <span
          className={cn(
            "mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold",
            avatarTint(label),
          )}
        >
          {initials(label)}
        </span>
      )}
      <div
        className={cn(
          "flex min-w-0 max-w-[82%] flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex items-baseline gap-2",
            isOwn && "flex-row-reverse",
          )}
        >
          <span className="text-xs font-semibold text-navy">{label}</span>
          <span className="text-[11px] text-muted-foreground">
            {formatDateTime(lastEvent.at)}
          </span>
        </div>
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
      </div>
    </div>
  );
}
