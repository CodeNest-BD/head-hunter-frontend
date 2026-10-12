import type { ReactNode } from "react";

import { Card, CardContent } from "@/shared/ui-components/controls/card";

export function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

/** Skeleton shown while an admin detail page loads. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-24 animate-pulse rounded-md border border-line bg-surface" />
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="h-36 animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/** A ruled block of the profile sidebar, headed in the design's 11px caps. */
export function SideSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-5 py-4 first:pt-5 last:pb-5 [&+&]:border-t [&+&]:border-line">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-label font-[650] uppercase tracking-[0.06em] text-ink-muted">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A label/value pair in the sidebar: muted label left, value right. */
export function SideFact({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sub">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="m-0 min-w-0 text-right text-ink">{value || "—"}</dd>
    </div>
  );
}
