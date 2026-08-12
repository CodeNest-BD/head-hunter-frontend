import { formatDateTime } from "@/shared/utils/formatDate";
import type { ConversationEvent } from "../schemas";

export interface SystemEventProps {
  event: ConversationEvent;
}

/**
 * A neutral, centered entry for every non-message event — submission,
 * candidate, proposal, hire_response, offer, and `"unknown"` (an event type
 * this build doesn't recognise yet). All of them render the same way: title,
 * optional body, timestamp — so an unfamiliar type still renders plainly
 * instead of being dropped.
 */
export function SystemEvent({ event }: SystemEventProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      <p className="text-xs font-medium text-muted-foreground">{event.title}</p>
      {event.body && (
        <p className="max-w-md text-xs text-muted-foreground/80">
          {event.body}
        </p>
      )}
      <span className="text-[11px] text-muted-foreground/60">
        {formatDateTime(event.at)}
      </span>
    </div>
  );
}
