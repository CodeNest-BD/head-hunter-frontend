import type { ReactNode } from "react";

import { Card, CardContent } from "@/shared/ui-components/controls/card";

/**
 * The reference's `.facts` grid — the layout every admin detail card uses for
 * its label/value pairs. Three up on a wide card, two up on a narrow one.
 */
export const FACTS_GRID = "grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3";

/** A fact that claims the whole row (a description, a URL). */
export const FACT_FULL = "col-span-2 sm:col-span-3";

/** `.fact` — the label/value stack used across the admin detail cards. */
export function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="text-label font-[650] uppercase text-ink-muted">
        {label}
      </div>
      <div className="mt-[3px] break-words text-body font-[550] text-ink">
        {value || "—"}
      </div>
    </div>
  );
}

/**
 * A rail card's facts: one per row, label left and value right.
 *
 * The three-up `FACTS_GRID` is for a full-width card. In the ~340px rail it
 * put three columns in the space of one — "payout-demo@exam ple.test" broke
 * mid-word — so a rail stacks its facts and lets each value have the width.
 */
export const RAIL_FACTS = "flex flex-col gap-2.5";

export function RailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-sub text-ink-muted">{label}</span>
      <span className="min-w-0 break-words text-right text-sub font-[550] text-ink">
        {value === null || value === undefined || value === "" ? "—" : value}
      </span>
    </div>
  );
}

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
