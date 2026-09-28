import type { ReactNode } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.refchip`: the inline reference to another entity — the job
 * a submission belongs to, the thread a dispute came from. A bordered 20px
 * chip on the info tint, sized to sit inside a 44px table row.
 */
export function RefChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center gap-[5px] truncate whitespace-nowrap rounded-xs border border-info-line bg-info-bg px-[7px] text-[11.5px] font-[550] text-info [&_svg]:size-[11px] [&_svg]:shrink-0",
        className,
      )}
    >
      {children}
    </span>
  );
}
