import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** A single call to action beneath the copy. */
  action?: ReactNode;
  className?: string;
}

/**
 * The reference's `.empty`: a centred 44px-tall well with a tinted circular
 * glyph, a 14px/650 title and a capped 340px line of explanation.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const Glyph = icon ?? Inbox;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 px-5 py-11 text-center",
        className,
      )}
    >
      <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-tint text-blue">
        <Glyph className="size-[18px]" aria-hidden="true" />
      </span>
      <p className="text-block font-[650] text-ink">{title}</p>
      {description && (
        <p className="max-w-[340px] text-[12.5px] text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
