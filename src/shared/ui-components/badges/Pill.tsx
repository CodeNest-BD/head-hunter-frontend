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
  blue: "bg-info-bg text-info",
};

/**
 * The dot is BRIGHTER than the label it leads — the design gives each tone
 * three values (chip, label, dot), not two. Painting the dot in the label's
 * own colour, as the old system did, loses the distinction between the word
 * (which has to be readable) and the marker (which has to be visible at a
 * glance down a column).
 */
export const TONE_DOT: Record<PillTone, string> = {
  ok: "bg-ok-dot",
  warn: "bg-warn-dot",
  bad: "bg-bad-dot",
  info: "bg-info-dot",
  violet: "bg-violet-dot",
  neutral: "bg-neutral-dot",
  blue: "bg-info-dot",
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
 * The design's status chip: a 24px capsule at 12px/500 on a tinted fill, led
 * by a 6px dot in the tone's own brighter marker colour.
 *
 * Status is "a dot and a word, never colour alone" — the label always carries
 * the meaning, so the chip stays readable without its fill.
 */
export function Pill({ tone, children, plain = false, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-meta font-medium",
        TONE[tone],
        className,
      )}
    >
      {!plain && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        />
      )}
      {children}
    </span>
  );
}
