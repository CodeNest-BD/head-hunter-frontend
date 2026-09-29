"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/shared/libs/shadCnConfig";

export interface DashboardPanel {
  id: string;
  /** Tab label below `lg`. */
  label: string;
  /** Desktop grid placement, e.g. "lg:col-span-2". */
  className?: string;
  content: ReactNode;
}

/**
 * A dashboard's content panels: the usual grid at `lg` and up, one panel at a
 * time behind tabs below it — stacked, they turn a phone dashboard into a very
 * long scroll past charts and lists.
 *
 * Every panel stays mounted and the inactive ones are CSS-hidden, so switching
 * tabs never remounts a chart or discards a list's scroll position, and the
 * desktop grid can still show them all at once. (Radix `Tabs` can do neither.)
 */
export function PanelGroup({
  panels,
  gridClassName,
  primaryId,
}: {
  panels: readonly DashboardPanel[];
  gridClassName?: string;
  /**
   * The panel that leads on a phone: its tab comes first and is selected by
   * default. Only the tab strip reorders — the grid below keeps `panels` order,
   * so the desktop layout is unaffected.
   */
  primaryId?: string;
}) {
  const [active, setActive] = useState(primaryId ?? panels[0]?.id ?? "");
  const tabs = primaryId
    ? [...panels].sort((a, b) =>
        a.id === primaryId ? -1 : b.id === primaryId ? 1 : 0,
      )
    : panels;

  return (
    <div>
      {/* `.tabs` — the same underline bar the rest of the app uses, rule and
          all: an inset shadow rather than a border, so no trigger has to hang a
          pixel below the bar and raise a scrollbar inside its own scroll port. */}
      <div
        role="tablist"
        className="flex items-center gap-0.5 overflow-x-auto shadow-[inset_0_-1px_0_var(--line)] lg:hidden"
      >
        {tabs.map((panel) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            aria-selected={panel.id === active}
            onClick={() => setActive(panel.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-[13px] py-[9px] text-sub font-semibold transition-colors",
              panel.id === active
                ? "border-blue text-blue"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {panel.label}
          </button>
        ))}
      </div>

      <div className={cn("mt-3 grid gap-3 lg:mt-0", gridClassName)}>
        {panels.map((panel) => (
          <div
            key={panel.id}
            role="tabpanel"
            className={cn(
              "lg:block",
              panel.className,
              panel.id === active ? "block" : "hidden",
            )}
          >
            {panel.content}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The reference's `.stat`: an uppercase 11px label, a 24px tabular figure and a
 * 12px hint stacked at the left, with a 34px tinted glyph tile at the right.
 * Every stat card in the app is this one shape — the reference defines no
 * emphasised variant, so a figure never out-shouts its neighbours.
 *
 * Pass `href` when the number has somewhere to go: a stat the reader cannot act
 * on is decoration, and the figure is usually the reason they came to the page.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  hintTone = "default",
  className: classNameProp,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Optional trailing icon, shown in a soft blue tile. */
  icon?: LucideIcon;
  href?: string;
  /** `.stat__hint--warn` — amber ink for a hint that flags a problem. */
  hintTone?: "default" | "warn";
  /** Grid placement from the caller, e.g. a lead card spanning both columns. */
  className?: string;
}) {
  // Every stat card lifts a little on hover, and its glyph tile warms and
  // leans in. A card that also links somewhere lifts further and draws its
  // border — so the motion tells you what is clickable rather than decorating
  // everything equally. `group` lets the tile react to the card, not itself.
  const className = cn(
    "group flex items-start gap-3 rounded-md border border-line bg-surface px-4 py-3.5 shadow-e1",
    "transition-[box-shadow,transform,border-color] duration-200 ease-out",
    "hover:-translate-y-px hover:shadow-e2 motion-reduce:transform-none",
    href &&
      "hover:-translate-y-0.5 hover:border-line-strong motion-reduce:transform-none",
    classNameProp,
  );
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-label font-[650] uppercase text-ink-muted">
          {label}
        </p>
        {/* A money figure carries no spaces, so without an explicit break it
            runs straight out of the card on a narrow track. */}
        <p className="mt-[5px] break-words text-stat font-bold tabular-nums text-ink">
          {value}
        </p>
        {hint && (
          <p
            className={cn(
              "mt-1 text-meta",
              hintTone === "warn" ? "font-[550] text-warn" : "text-ink-faint",
            )}
          >
            {hint}
          </p>
        )}
      </div>
      {Icon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8.5 shrink-0 items-center justify-center rounded-sm bg-tint text-blue",
            "transition-[background-color,transform] duration-200 ease-out",
            "group-hover:bg-tint-strong group-hover:scale-105 motion-reduce:transform-none",
          )}
        >
          <Icon className="size-[17px]" />
        </span>
      )}
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Stands in for a `StatCard` figure whose query has not landed yet. It is an
 * inline-block shorter than the figure's line box, so the card keeps exactly
 * the height it will have once the number arrives and the strip never jumps.
 */
export function StatValueSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[17px] w-16 animate-pulse rounded-xs bg-surface-sunken align-middle"
    />
  );
}

export type AttentionTone = "blue" | "amber" | "muted";

export interface AttentionItem {
  readonly id: string;
  readonly tone: AttentionTone;
  readonly title: string;
  readonly detail: string;
  readonly actionLabel: string;
  readonly href: string;
}

const DOT_TONE: Record<AttentionTone, string> = {
  blue: "bg-blue",
  amber: "bg-pending",
  muted: "bg-ink-faint",
};

/**
 * The reference's `.attn`: a status dot, the headline over its one-line reason,
 * and a small outline button carrying the action to the right edge.
 */
export function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5 last:border-b-0">
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", DOT_TONE[item.tone])}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sub font-semibold text-ink">{item.title}</p>
        <p className="text-meta text-ink-muted">{item.detail}</p>
      </div>
      <Link
        href={item.href}
        className="inline-flex h-7.5 shrink-0 items-center whitespace-nowrap rounded-xs border border-line-strong bg-surface px-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-sub"
      >
        {item.actionLabel}
      </Link>
    </div>
  );
}

/**
 * The reference's `.card` with a `.card__head`: a title ruled off from a body
 * that is a list of rows. The rows supply their own padding, so the body does
 * not add any of its own.
 */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-md border border-line bg-surface shadow-e1">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <h2 className="text-card font-[650] text-ink">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}
