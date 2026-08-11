import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ConversationEvent } from "../schemas";

export interface MessageBubbleProps {
  event: ConversationEvent;
  /** The signed-in viewer's own party. Determines which side a message
   * renders on — the viewer's own messages sit opposite the counterparty's,
   * regardless of which party (company or recruiter) actually sent it. */
  viewerParty: "company" | "recruiter";
}

const ACTOR_BUBBLE: Record<string, string> = {
  company: "bg-navy text-white",
  recruiter: "bg-primary text-primary-foreground",
};

const ACTOR_LABEL: Record<string, string> = {
  company: "Company",
  recruiter: "Recruiter",
};

/**
 * One message entry. Body is rendered as plain text — never
 * `dangerouslySetInnerHTML` — since it is free-form input from the
 * counterparty, not trusted markup.
 */
export function MessageBubble({ event, viewerParty }: MessageBubbleProps) {
  const actor = event.actor ?? "recruiter";
  const isOwnMessage = actor === viewerParty;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start",
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {ACTOR_LABEL[actor] ?? "Message"}
      </span>
      <div
        className={cn(
          "max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm",
          ACTOR_BUBBLE[actor] ?? "bg-muted text-foreground",
        )}
      >
        {event.body}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {formatDateTime(event.at)}
      </span>
    </div>
  );
}
