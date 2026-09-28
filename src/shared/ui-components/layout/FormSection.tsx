"use client";

import type { ReactNode } from "react";

/**
 * The reference's `.formsec`: a 220px column carrying the section title and its
 * hint, the fields in a two-up grid beside it, and a hairline between one
 * section and the next. Collapses to a single column below 860px.
 */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-5 gap-y-2.5 border-t border-line px-5 py-4.5 first:border-t-0 md:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <h3 className="text-[13.5px] font-[650] text-ink">{title}</h3>
        {hint && (
          <p className="mt-[3px] text-meta leading-[1.45] text-ink-muted">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
