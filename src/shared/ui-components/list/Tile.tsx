import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

export type TileTone = "blue" | "ok" | "warn" | "bad" | "violet" | "neutral";

/**
 * `sm` is the 32px glyph that leads a row; `lg` is the 36px one a summary card
 * wears, sized off the 22px figure beside it so neither out-weighs the other.
 */
export type TileSize = "sm" | "lg";

const TONE: Record<TileTone, string> = {
  blue: "bg-tint text-blue",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-neutral-bg text-neutral",
};

const SIZE: Record<TileSize, { box: string; glyph: string }> = {
  sm: { box: "size-8 rounded-sm", glyph: "size-[15px]" },
  lg: { box: "size-9 rounded-md", glyph: "size-[18px]" },
};

/**
 * The reference's `.tile`: the tinted glyph that leads a notification, an
 * activity row, a section heading or a summary card. Same six tones as the
 * status pills, so an event's icon and its badge always agree.
 */
export function Tile({
  icon: Icon,
  tone,
  size = "sm",
  className,
}: {
  icon: LucideIcon;
  tone: TileTone;
  size?: TileSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        SIZE[size].box,
        TONE[tone],
        className,
      )}
    >
      <Icon className={SIZE[size].glyph} aria-hidden="true" />
    </span>
  );
}
