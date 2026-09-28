import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface ListRowProps {
  children: ReactNode;
  /**
   * The element to render. Lists that are semantically lists pass `"li"` so the
   * row *is* the list item — wrapping this in an outer `<li>` would make the row
   * an only child, and `last:border-b-0` could then never fire, leaving a
   * hairline under the final row.
   */
  element?: "div" | "li";
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
  element: Element = "div",
  unread = false,
  selected = false,
  interactive = false,
  className,
}: ListRowProps) {
  return (
    <Element
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
    </Element>
  );
}
