import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface ListRowProps {
  children: ReactNode;
  /** Tints the row and marks its left edge with a cobalt bar. */
  unread?: boolean;
  /** The reading pane's current row — a solid tint, no separate hover. */
  selected?: boolean;
  /** Adds the hover wash for a row that is itself a link or button. */
  interactive?: boolean;
  className?: string;
}

/**
 * The reference's `.listrow`: an 11px/16px row separated by a hairline, with
 * the unread and selected states the inbox and notification lists share.
 */
export function ListRow({
  children,
  unread = false,
  selected = false,
  interactive = false,
  className,
}: ListRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-[11px] border-b border-line px-4 py-[11px] last:border-b-0",
        interactive && !selected && "hover:bg-surface-sub",
        unread && !selected && "bg-unread shadow-rail",
        unread && !selected && interactive && "bg-unread-hover",
        selected && "bg-tint shadow-rail",
        className,
      )}
    >
      {children}
    </div>
  );
}
