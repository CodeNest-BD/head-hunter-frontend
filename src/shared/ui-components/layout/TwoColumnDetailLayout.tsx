import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

export interface TwoColumnDetailLayoutProps {
  /** Rendered above the two columns at its own natural height — typically a
   * back link plus `PageHeader`. Deliberately outside the fixed-height box
   * below: its height can't be known ahead of time (a back link may or may
   * not be present, subtitles vary in length), so it isn't part of
   * `PAGE_HEIGHT_CLASSNAME`'s arithmetic — the row below just takes
   * whatever space is left after it via `flex-1`/`min-h-0`. */
  header?: ReactNode;
  /** Upper info block — job/submission header and the candidate list. */
  left: ReactNode;
  /** The conversation thread. */
  right: ReactNode;
}

/**
 * The vertical space this layout can never use, on every page it renders
 * inside `DashboardLayout`: `main`'s `pt-20` (5rem — 4rem clearing the fixed
 * top bar, plus a 1rem gap) plus its `pb-16` (4rem) bottom padding. 5rem +
 * 4rem = 9rem.
 *
 * This is the only viewport-relative number in this file, and the only
 * thing it has to know is `DashboardLayout`'s own chrome — never this page's
 * `header`. That split (fixed outer height, flexed inner row) is what makes
 * the columns size correctly regardless of what `header` turns out to be,
 * rather than also guessing its height here.
 */
const PAGE_HEIGHT_CLASSNAME = "lg:h-[calc(100vh-9rem)]";

/**
 * Two-part detail page shell: an optional header block at natural height,
 * then job/candidate info on the left and the conversation on the right.
 * Stacks to a single column below `lg`, matching the breakpoint
 * `DashboardLayout` itself switches on.
 *
 * At `lg` and up, the whole shell is pinned to the exact space
 * `DashboardLayout` leaves for it (`PAGE_HEIGHT_CLASSNAME`), so the page
 * itself never scrolls — both columns scroll internally instead. That keeps
 * the conversation's composer on screen without depending on a guess at
 * `header`'s height, which a plain viewport `calc()` on the right column
 * alone cannot account for.
 */
export function TwoColumnDetailLayout({
  header,
  left,
  right,
}: TwoColumnDetailLayoutProps) {
  return (
    <div className={cn("flex w-full flex-col gap-6", PAGE_HEIGHT_CLASSNAME)}>
      {header && <div className="shrink-0">{header}</div>}
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
        {/* `self-start` on this column only, not `items-start` on the grid: this
            side should be as tall as its content, so a short submission leaves no
            blank band under it, while the thread on the right must keep filling
            the height to pin its composer to the bottom. */}
        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto lg:max-h-full lg:self-start">
          {left}
        </div>
        <div className="min-h-0 lg:h-full">{right}</div>
      </div>
    </div>
  );
}
