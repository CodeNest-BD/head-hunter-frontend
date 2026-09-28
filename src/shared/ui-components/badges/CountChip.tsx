import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.countchip`: the tinted tally that sits beside a page title
 * or a card heading. Tabular figures so a changing count never shifts the row.
 */
export function CountChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full bg-tint px-2 text-[11.5px] font-[650] tabular-nums text-blue-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
