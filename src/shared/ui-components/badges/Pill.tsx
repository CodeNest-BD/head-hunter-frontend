import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The seven status tones the reference defines. Statuses pick a tone rather
 * than a color, so a new status can never invent an off-palette pill.
 */
export type PillTone =
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "violet"
  | "neutral"
  | "blue";

const TONE: Record<PillTone, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-neutral-bg text-neutral",
  blue: "bg-tint text-blue",
};

export interface PillProps {
  tone: PillTone;
  children: ReactNode;
  /**
   * Drops the leading dot. The reference uses the plain form where the pill
   * carries a value rather than a state — e.g. "$0 — set a fee".
   */
  plain?: boolean;
  className?: string;
}

/**
 * The reference's `.pill`: a 21px capsule at 11px/650 on a tinted fill, led by
 * a 5px dot in the same ink as its label.
 */
export function Pill({ tone, children, plain = false, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5.25 items-center gap-[5px] whitespace-nowrap rounded-full px-2 text-[11px] font-[650] tracking-[0.02em]",
        TONE[tone],
        className,
      )}
    >
      {!plain && (
        <span
          aria-hidden="true"
          className="size-[5px] shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}
