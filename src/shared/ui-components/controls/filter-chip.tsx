"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * The reference's `.chip`: a 28px pill that is a hairline outline when idle and
 * a solid cobalt fill when on. Selection state is exposed via aria-pressed.
 */
export function FilterChip({
  active,
  onClick,
  children,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-[11px] text-[12.5px] font-[550] transition-colors",
        active
          ? "border-blue bg-blue text-white"
          : "border-line-strong bg-surface text-ink-muted hover:border-blue-ink hover:text-blue-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
