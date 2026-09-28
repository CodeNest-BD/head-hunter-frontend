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
        "max-w-full whitespace-pre-wrap break-words rounded-[12px] border px-3 py-2 text-sub",
        // A single squared corner on the sender's side gives each bubble a
        // subtle tail pointing back at its author.
        isOwn
          ? "rounded-tr-[4px] border-blue bg-blue text-white"
          : "rounded-tl-[4px] border-line bg-surface-sub text-ink-body",
      )}
    >
      {event.body}
    </div>
  );
}
