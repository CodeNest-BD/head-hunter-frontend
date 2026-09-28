import { CheckCircle2, Info } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ConversationEvent } from "../schemas";

export interface SystemEventProps {
  event: ConversationEvent;
}

/**
 * A centered pill for every non-message event — submission, candidate,
 * hire_response and `"unknown"` (a type this build doesn't recognise yet).
 * A submission reads as a positive milestone (green); everything else stays
 * neutral, so an unfamiliar type still renders plainly instead of being
 * dropped or mislabeled as success.
 */
export function SystemEvent({ event }: SystemEventProps) {
  const positive = event.type === "submission" || event.type === "candidate";
  return (
    <div className="flex justify-center py-1.5">
      <span
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-meta font-[550]",
          positive
            ? "border-ok-line bg-ok-bg text-ok"
            : "border-line bg-surface-sub text-ink-muted",
        )}
      >
        {positive ? (
          <CheckCircle2 className="size-[15px] shrink-0" aria-hidden="true" />
        ) : (
          <Info className="size-[15px] shrink-0" aria-hidden="true" />
        )}
        <span className="truncate">
          {event.title}
          {event.body ? (
            <span className="opacity-80"> — {event.body}</span>
          ) : null}
        </span>
        <span
          className={cn(
            "shrink-0 pl-0.5 text-[11px] tabular-nums",
            positive ? "text-ok/80" : "text-ink-faint",
          )}
        >
          {formatDateTime(event.at)}
        </span>
      </span>
    </div>
  );
}
