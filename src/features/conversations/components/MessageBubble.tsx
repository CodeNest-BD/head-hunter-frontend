import { cn } from "@/shared/libs/shadCnConfig";
import type { ConversationEvent } from "../schemas";

export interface MessageBubbleProps {
  event: ConversationEvent;
  /** Whether the signed-in viewer sent this message. Colour and alignment
   * are decided entirely by this — never by which party (company or
   * recruiter) actually sent it — so the viewer's own messages always look
   * the same regardless of which role they're signed in as. `MessageGroup`
   * derives this once per group and passes it down. */
  isOwn: boolean;
}

/**
 * One message bubble — no label or timestamp of its own; `MessageGroup`
 * renders exactly one of each per run of consecutive messages. Body is
 * rendered as plain text — never `dangerouslySetInnerHTML` — since it is
 * free-form input from the counterparty, not trusted markup.
 */
export function MessageBubble({ event, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[85%] whitespace-pre-wrap break-words rounded-md px-4 py-2 text-sm shadow-sm sm:max-w-[75%]",
        isOwn
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground",
      )}
    >
      {event.body}
    </div>
  );
}
