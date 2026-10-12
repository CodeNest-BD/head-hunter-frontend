"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import { TONE_DOT, type PillTone } from "@/shared/ui-components/badges/Pill";

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
 * Stands in for a band figure whose query has not landed yet. It is an
 * inline-block shorter than the figure's line box, so the tile keeps exactly
 * the height it will have once the number arrives and the band never jumps.
 */
export function StatValueSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[17px] w-16 animate-pulse rounded-xs bg-surface-sunken align-middle"
    />
  );
}

/**
 * A surface on a dashboard: white, 12px, separated by a ring.
 *
 * Not `Card` — a dashboard section carries its own head with its own padding
 * (18/24/14 rather than Card's 20/24/12) and several of them hold a full-bleed
 * table, which Card's padded body would inset.
 */
export function Section({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-lg bg-surface shadow-e1",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** A section's head: title on the left, a control on the right. */
export function SectionHead({
  title,
  sub,
  action,
  className,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-6 pb-3.5 pt-[18px]",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-[16px] font-semibold leading-5 text-ink">
          {title}
        </h2>
        {sub && <span className="text-meta text-ink-muted">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

/**
 * The design's segmented control: a tinted track with the selected chip raised
 * on white.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-sm bg-neutral-bg p-[3px]"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-xs px-3 text-meta font-medium transition-colors",
              on ? "bg-surface text-ink shadow-chip" : "text-ink-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The tinted fill each tone wears on a chip or an icon square. */
const TONE_FILL: Record<PillTone, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-neutral-bg text-neutral",
  blue: "bg-info-bg text-info",
};

/** The dot-and-word status chip an attention row wears. */
export function PriorityChip({
  tone,
  children,
}: {
  tone: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-meta font-medium",
        TONE_FILL[tone],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
      />
      {children}
    </span>
  );
}

/**
 * One thing waiting on whoever is reading the dashboard.
 *
 * `count` is optional because the three roles mean different things by a row:
 * an admin's rows are queues that genuinely have a size, while a recruiter's
 * are usually a single prompt. A row with nothing to count reports nothing
 * rather than a misleading "1".
 */
export interface AttentionItem {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly tone: PillTone;
  readonly label: string;
  /** The line under the label saying why it is here. */
  readonly context: string;
  readonly priorityLabel: string;
  readonly count?: number;
  readonly actionLabel: string;
  readonly href: string;
}

/**
 * The "Needs your attention" table every dashboard uses: a tinted glyph, what
 * is waiting and why, how urgent it is, and the one control that deals with
 * it. The count column is dropped entirely when no row has a count, rather
 * than left as a column of dashes.
 */
export function AttentionTable({
  items,
  emptyMessage,
}: {
  items: readonly AttentionItem[];
  emptyMessage: string;
}) {
  const counted = items.some((item) => item.count !== undefined);
  // Tailwind only sees class names written whole, so both grids are literals.
  const grid = counted
    ? "[grid-template-columns:minmax(0,1fr)_128px_64px_92px]"
    : "[grid-template-columns:minmax(0,1fr)_128px_92px]";
  const columns = counted
    ? ["Item", "Priority", "Count", "Action"]
    : ["Item", "Priority", "Action"];

  if (items.length === 0) {
    return (
      <p className="px-6 py-7 text-center text-sub text-ink-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div role="table" aria-label="Needs your attention">
      <div
        role="row"
        className={cn(
          "grid h-9 items-center gap-4 bg-surface-head px-6 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-ink-muted shadow-[inset_0_-1px_0_theme(colors.line.head),inset_0_1px_0_theme(colors.line.head)]",
          grid,
        )}
      >
        {columns.map((column, index) => (
          <span
            key={column}
            role="columnheader"
            className={cn(
              counted && index === 2 && "text-right",
              // The action column is named for screen readers only — the
              // design leaves it blank above the buttons.
              index === columns.length - 1 && "sr-only",
            )}
          >
            {column}
          </span>
        ))}
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            role="row"
            className={cn(
              "grid min-h-[68px] items-center gap-4 px-6 shadow-[inset_0_-1px_0_theme(colors.line.row)] transition-colors hover:bg-surface-sub",
              grid,
            )}
          >
            <span role="cell" className="flex min-w-0 items-center gap-3.5">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[34px] shrink-0 items-center justify-center rounded-sm",
                  TONE_FILL[item.tone],
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-body font-medium text-ink">
                  {item.label}
                </span>
                <span className="truncate text-meta text-ink-muted">
                  {item.context}
                </span>
              </span>
            </span>
            <span role="cell">
              <PriorityChip tone={item.tone}>{item.priorityLabel}</PriorityChip>
            </span>
            {counted && (
              <span
                role="cell"
                className="text-right text-[16px] font-semibold tabular-nums text-ink"
              >
                {item.count ?? ""}
              </span>
            )}
            <span role="cell" className="text-right">
              <Button asChild variant="outline" size="xs">
                <Link href={item.href}>{item.actionLabel}</Link>
              </Button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** One thing that already happened, for the activity feed. */
export interface ActivityItem {
  readonly id: string;
  readonly tone: PillTone;
  readonly title: string;
  readonly detail?: string;
  /** Who or what caused it, when that is worth saying. */
  readonly meta?: string;
  /**
   * `Date` or ISO string — the notification feeds parse their timestamps and
   * the admin dashboard does not, and neither should have to convert just to
   * hand it to `formatAt`.
   */
  readonly at: string | Date;
}

/** The ring each tone's dot sits in — written whole so Tailwind emits them. */
const DOT_RING: Record<PillTone, string> = {
  ok: "ring-ok-bg",
  warn: "ring-warn-bg",
  bad: "ring-bad-bg",
  info: "ring-info-bg",
  violet: "ring-violet-bg",
  neutral: "ring-neutral-bg",
  blue: "ring-info-bg",
};

/**
 * The "Recent activity" feed every dashboard uses: a toned dot, what happened,
 * and when. One row shape across the three roles, so the same event does not
 * look like two different things depending on who is signed in.
 */
export function ActivityFeed({
  items,
  emptyMessage,
  formatAt,
}: {
  items: readonly ActivityItem[];
  emptyMessage: string;
  /** How the timestamp reads — each dashboard already has its own rule. */
  formatAt: (at: string | Date) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="px-6 py-7 text-center text-sub text-ink-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className="m-0 list-none p-0">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 px-6 py-3 shadow-[inset_0_1px_0_theme(colors.line.row)]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full ring-[3px]",
              TONE_DOT[item.tone],
              DOT_RING[item.tone],
            )}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sub">
              <span className="font-medium text-ink">{item.title}</span>
              {item.detail && (
                <>
                  {" "}
                  <span className="text-ink-body">{item.detail}</span>
                </>
              )}
            </span>
            {item.meta && (
              <span className="text-meta text-ink-muted">{item.meta}</span>
            )}
          </span>
          <span className="whitespace-nowrap text-meta tabular-nums text-ink-muted">
            {formatAt(item.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * One tile of a `QuickViewBand`. A tile that stands for a filter is a button
 * carrying `aria-pressed`; one that only reports a figure is a plain `div`, so
 * a number with nothing behind it never looks pressable.
 */
export interface QuickView {
  readonly key: string;
  readonly label: string;
  /** `ReactNode` so a tile can hold a `StatValueSkeleton` until its count lands. */
  readonly value: ReactNode;
  /** The line under the figure that says what it counts. */
  readonly note: string;
  readonly tone: PillTone;
  /** Omit for a read-only tile — see above. */
  readonly filter?: {
    readonly active: boolean;
    readonly apply: () => void;
  };
  /**
   * Where the figure goes, for a band that navigates rather than filters — a
   * dashboard's summary. Mutually exclusive with `filter`: a tile is one or
   * the other, never both.
   */
  readonly href?: string;
}

function QuickViewTile({ view }: { view: QuickView }) {
  const { filter, href, tone } = view;
  const body = (
    <>
      <span className="flex items-center gap-2 text-meta font-medium text-ink-muted">
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        />
        {view.label}
      </span>
      <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums">
        {view.value}
      </span>
      <span className="text-meta leading-[18px] text-ink-muted">
        {view.note}
      </span>
      {filter?.active && (
        /* The pressed marker is its own element rather than a second inset
           shadow: the tile already spends its shadow on the divider, and two
           inset shadows on one box fight whenever `cn` merges them. */
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-blue"
        />
      )}
    </>
  );

  const className = cn(
    "relative flex flex-col gap-1 px-6 py-4.5 text-left text-ink",
    "shadow-[inset_-1px_0_0_theme(colors.line.DEFAULT)] last:shadow-none",
    // A queue in the warn tone keeps a warm wash at rest: it is the tile an
    // admin should notice before reading any of the figures.
    tone === "warn" && "bg-warn-bg/45",
    (filter || href) &&
      "transition-colors duration-150 ease-out hover:bg-surface-sub",
    filter?.active && "bg-tint hover:bg-tint",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  if (!filter) return <div className={className}>{body}</div>;

  return (
    <button
      type="button"
      aria-pressed={filter.active}
      onClick={filter.apply}
      className={className}
    >
      {body}
    </button>
  );
}

/**
 * The reference's quick-view band above a directory: one surface split by
 * hairlines, each cell a figure that doubles as the filter behind it. Pressing
 * a tile applies its filter and pressing it again clears it, so the band is
 * both the summary and the way into each slice.
 *
 * One band for every summary in the app: a tile either links somewhere
 * (`href`), toggles the filter it counts (`filter`), or just reports.
 */
export function QuickViewBand({
  label,
  views,
}: {
  /** Names the band for screen readers, e.g. "Recruiter quick views". */
  label: string;
  views: readonly QuickView[];
}) {
  return (
    <section
      aria-label={label}
      className="overflow-hidden rounded-lg bg-surface shadow-e1"
    >
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {views.map((view) => (
          <QuickViewTile key={view.key} view={view} />
        ))}
      </div>
    </section>
  );
}
