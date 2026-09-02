"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
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
      <div
        role="tablist"
        className="flex items-center gap-4 overflow-x-auto border-b border-border lg:hidden"
      >
        {tabs.map((panel) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            aria-selected={panel.id === active}
            onClick={() => setActive(panel.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors",
              panel.id === active
                ? "border-primary text-navy"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {panel.label}
          </button>
        ))}
      </div>

      <div className={cn("mt-4 grid gap-4 lg:mt-0", gridClassName)}>
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
 * A single headline metric on the light scheme: an optional circular icon badge
 * leads, the label/figure/hint stack in the middle, and a trailing arrow appears
 * when the card links somewhere — echoing the dashboard's left-to-right flow.
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
  className: classNameProp,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Optional leading icon, shown in a soft blue circle. */
  icon?: LucideIcon;
  href?: string;
  /** Grid placement from the caller, e.g. a lead card spanning both columns. */
  className?: string;
}) {
  const className = cn(
    "group block rounded-md border border-border bg-card p-4 shadow-card sm:p-5",
    href && "transition-colors hover:border-primary/40",
    classNameProp,
  );
  const body = (
    <div className="flex items-start gap-3">
      {Icon && (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
          {label}
        </p>
        {/* Figure over hint, always stacked: beside the number, a multi-word
            hint collides with a large figure once the card is narrow (e.g. the
            3-up wallet grid). Stacking keeps it clean at every width. */}
        <div className="mt-1.5 flex flex-col gap-0.5 sm:mt-2">
          <span className="text-2xl font-extrabold tracking-[-0.02em] tabular-nums text-navy sm:text-3xl">
            {value}
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground sm:text-sm">
              {hint}
            </span>
          )}
        </div>
      </div>
      {href && (
        <ArrowRight
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-primary/70 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </div>
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
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
  blue: "bg-primary",
  amber: "bg-[#E0A008]",
  muted: "bg-brand-sky",
};

export function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3.5 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            DOT_TONE[item.tone],
          )}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">{item.title}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            {item.detail}
          </p>
        </div>
      </div>
      <Link
        href={item.href}
        className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary/80"
      >
        {item.actionLabel} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

/** A card whose body is a list, with a title and an optional header action. */
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
    <section className="flex flex-col rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold text-navy">{title}</h2>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}
