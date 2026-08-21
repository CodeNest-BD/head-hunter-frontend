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
 * A pill toggle used across the recruiter pages' filter rows: navy when active,
 * a bordered light chip otherwise. Selection state is exposed via aria-pressed.
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
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-navy text-white"
          : "border border-border bg-card text-navy hover:bg-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
