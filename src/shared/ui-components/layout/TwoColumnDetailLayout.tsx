import type { ReactNode } from "react";

export interface TwoColumnDetailLayoutProps {
  /** Upper info block — job/submission header and the candidate list. */
  left: ReactNode;
  /** The conversation thread. */
  right: ReactNode;
}

/**
 * Two-part detail page shell: job/candidate info on the left, the
 * conversation on the right. Stacks to a single column below `lg`, matching
 * the breakpoint `DashboardLayout` itself switches on. `lg:items-start` plus
 * `lg:sticky` keeps the (fixed-height) conversation panel in view while a
 * longer candidate list scrolls the page underneath it.
 */
export function TwoColumnDetailLayout({
  left,
  right,
}: TwoColumnDetailLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-6">{left}</div>
      <div className="lg:sticky lg:top-24">{right}</div>
    </div>
  );
}
