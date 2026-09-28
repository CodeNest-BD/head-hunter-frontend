import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

export type TileTone = "blue" | "ok" | "warn" | "bad" | "violet" | "neutral";

const TONE: Record<TileTone, string> = {
  blue: "bg-tint text-blue",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-neutral-bg text-neutral",
};

/**
 * The reference's `.tile`: the 32px tinted glyph that leads a notification, an
 * activity row or a section heading. Same six tones as the status pills, so an
 * event's icon and its badge always agree.
 */
export function Tile({
  icon: Icon,
  tone,
  className,
}: {
  icon: LucideIcon;
  tone: TileTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-sm",
        TONE[tone],
        className,
      )}
    >
      <Icon className="size-[15px]" aria-hidden="true" />
    </span>
  );
}
