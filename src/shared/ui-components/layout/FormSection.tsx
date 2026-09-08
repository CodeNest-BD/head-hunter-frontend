"use client";

import type { ReactNode } from "react";

/** A form section: title + hint on the left, fields on the right. */
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
    <div className="grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]">
      <div>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        {hint && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
