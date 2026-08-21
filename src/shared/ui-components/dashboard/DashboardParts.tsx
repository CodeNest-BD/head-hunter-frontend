"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * A single headline metric. Navy tone leads a dashboard's most important number.
 *
 * Pass `href` when the number has somewhere to go: a stat the reader cannot act
 * on is decoration, and the figure is usually the reason they came to the page.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "white",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "navy" | "white";
  href?: string;
}) {
  const navy = tone === "navy";
  const className = cn(
    "block rounded-md p-5 shadow-card",
    navy ? "bg-navy" : "border border-border bg-card",
    href && "transition-colors hover:border-primary/40",
  );
  const body = (
    <>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.12em]",
          navy ? "text-white/55" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-extrabold tracking-[-0.02em] tabular-nums",
            navy ? "text-white" : "text-navy",
          )}
        >
          {value}
        </span>
        {hint && (
          <span
            className={cn(
              "text-sm",
              navy ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        )}
      </p>
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
