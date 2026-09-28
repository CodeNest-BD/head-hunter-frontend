import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.tag`: a selectable 26px spec chip — skills, specialties,
 * industries. Cobalt-tinted when on, a hairline outline when off. Renders as a
 * button when it can be toggled and as a static chip when it cannot.
 */
export interface TagProps {
  children: ReactNode;
  /** Omit for a read-only chip. */
  onClick?: () => void;
  selected?: boolean;
  /** `.tag--add` — the dashed "add one more" affordance. */
  variant?: "default" | "add";
  className?: string;
}

const BASE =
  "inline-flex h-6.5 items-center gap-[5px] rounded-full border px-2.5 text-meta font-[550] transition-colors [&_svg]:size-3";

export function Tag({
  children,
  onClick,
  selected = false,
  variant = "default",
  className,
}: TagProps) {
  const tone = selected
    ? "border-blue bg-tint text-blue-ink"
    : variant === "add"
      ? "border-dashed border-line-strong bg-surface text-ink-muted"
      : "border-line-strong bg-surface text-ink-body";
  const classes = cn(BASE, tone, className);

  if (!onClick) return <span className={classes}>{children}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      // `add` opens a draft field rather than toggling a value, so it must not
      // announce a pressed state it does not have.
      aria-pressed={variant === "add" ? undefined : selected}
      className={cn(classes, "hover:border-blue hover:text-blue-ink")}
    >
      {children}
    </button>
  );
}
