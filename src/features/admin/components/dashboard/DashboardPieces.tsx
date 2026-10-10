"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import { TONE_DOT, type PillTone } from "@/shared/ui-components/badges/Pill";

/**
 * A surface on the dashboard: white, 12px, separated by a ring.
 *
 * Not `Card` — the design's dashboard sections carry their own heads with
 * their own padding (18/24/14 rather than Card's 20/24/12) and several of them
 * hold a full-bleed table, which Card's padded body would inset.
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
 * on white. Used for the attention panel's All / Urgent scope.
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

/** The dot-and-word status chip the queue rows wear. */
export function PriorityChip({
  tone,
  children,
}: {
  tone: PillTone;
  children: ReactNode;
}) {
  const FILL: Record<PillTone, string> = {
    ok: "bg-ok-bg text-ok",
    warn: "bg-warn-bg text-warn",
    bad: "bg-bad-bg text-bad",
    info: "bg-info-bg text-info",
    violet: "bg-violet-bg text-violet",
    neutral: "bg-neutral-bg text-neutral",
    blue: "bg-info-bg text-info",
  };
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-meta font-medium",
        FILL[tone],
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

/** The column strip above a dashboard list — the table head, without a table. */
export function ListHead({ columns }: { columns: readonly string[] }) {
  return (
    <div
      role="row"
      className="grid h-9 items-center gap-4 bg-surface-head px-6 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-ink-muted shadow-[inset_0_-1px_0_theme(colors.line.head),inset_0_1px_0_theme(colors.line.head)] [grid-template-columns:minmax(0,1fr)_128px_64px_92px]"
    >
      {columns.map((c, i) => (
        <span
          key={c}
          role="columnheader"
          className={i === 2 ? "text-right" : undefined}
        >
          {i === 3 ? <span className="sr-only">{c}</span> : c}
        </span>
      ))}
    </div>
  );
}
