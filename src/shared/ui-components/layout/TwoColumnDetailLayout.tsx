"use client";

import { useState, type ReactNode } from "react";

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
  /** Tab labels below `lg`, where only one panel is on screen at a time. */
  leftLabel?: string;
  rightLabel?: string;
  /** Shows an unread dot on the right tab. The layout owns how it looks, so
   * it stays legible against both the active and inactive tab fills. */
  rightUnread?: boolean;
}

/**
 * The vertical space this layout can never use, on every page it renders
 * inside `DashboardLayout`: the fixed 56px top bar above `main`, plus `main`'s
 * own `pt-5` (1.25rem) and `pb-14` (3.5rem). 3.5 + 1.25 + 3.5 = 8.25rem.
 *
 * This is the only viewport-relative number in this file, and the only
 * thing it has to know is `DashboardLayout`'s own chrome — never this page's
 * `header`. That split (fixed outer height, flexed inner row) is what makes
 * the columns size correctly regardless of what `header` turns out to be,
 * rather than also guessing its height here.
 *
 * `dvh` below `lg` so a mobile browser's collapsing URL bar can't push the
 * composer off screen; `vh` at `lg` and up, where the two are equivalent and
 * the desktop value is unchanged.
 */
const PAGE_HEIGHT_CLASSNAME =
  "h-[calc(100dvh-8.25rem)] lg:h-[calc(100vh-8.25rem)]";

type DetailPanel = "left" | "right";

function PanelTab({
  active,
  label,
  unread = false,
  onSelect,
}: {
  active: boolean;
  label: string;
  unread?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "flex h-7 flex-1 items-center justify-center gap-1.5 rounded-xs px-3 text-[12.5px] font-semibold transition-colors",
        active
          ? "bg-surface text-ink shadow-e1"
          : "text-ink-muted hover:text-ink",
      )}
    >
      {label}
      {unread && (
        <span
          aria-label="Unread messages"
          className="size-1.5 rounded-full bg-blue"
        />
      )}
    </button>
  );
}

/**
 * Two-part detail page shell: an optional header block at natural height,
 * then job/candidate info on the left and the conversation on the right.
 *
 * At `lg` and up both columns are side by side, pinned to the exact space
 * `DashboardLayout` leaves for them (`PAGE_HEIGHT_CLASSNAME`), so the page
 * itself never scrolls — both columns scroll internally instead. That keeps
 * the conversation's composer on screen without depending on a guess at
 * `header`'s height, which a plain viewport `calc()` on the right column
 * alone cannot account for.
 *
 * Below `lg` there is no room for two columns, and stacking them buries the
 * conversation under the full detail panel. So the two become tabs and only
 * one is on screen at a time. Both stay mounted and are CSS-hidden, so
 * switching tabs — or crossing the breakpoint — never discards a half-typed
 * message or a scroll position.
 */
export function TwoColumnDetailLayout({
  header,
  left,
  right,
  leftLabel = "Details",
  rightLabel = "Conversation",
  rightUnread,
}: TwoColumnDetailLayoutProps) {
  const [panel, setPanel] = useState<DetailPanel>("left");

  return (
    <div className={cn("flex w-full flex-col gap-4", PAGE_HEIGHT_CLASSNAME)}>
      {header && <div className="shrink-0">{header}</div>}

      <div
        role="tablist"
        className="flex shrink-0 gap-0.5 rounded-sm border border-line bg-surface-sunken p-0.5 lg:hidden"
      >
        <PanelTab
          active={panel === "left"}
          label={leftLabel}
          onSelect={() => setPanel("left")}
        />
        <PanelTab
          active={panel === "right"}
          label={rightLabel}
          unread={rightUnread}
          onSelect={() => setPanel("right")}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {/* `self-start` on this column only, not `items-start` on the grid: this
            side should be as tall as its content, so a short submission leaves no
            blank band under it, while the thread on the right must keep filling
            the height to pin its composer to the bottom. */}
        <div
          role="tabpanel"
          className={cn(
            "min-h-0 flex-col gap-4 overflow-y-auto lg:flex lg:max-h-full lg:self-start",
            panel === "left" ? "flex" : "hidden",
          )}
        >
          {left}
        </div>
        <div
          role="tabpanel"
          className={cn(
            "min-h-0 lg:block lg:h-full",
            panel === "right" ? "block" : "hidden",
          )}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
