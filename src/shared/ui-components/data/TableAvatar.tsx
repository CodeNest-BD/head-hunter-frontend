import { cn } from "@/shared/libs/shadCnConfig";

import { monogram } from "./monogram";

/**
 * Small square avatar used in the first column of the management tables
 * (matches the reference's logo chips). Monogram only — no remote images —
 * so it never flashes or leaks a broken-image state.
 */
export function TableAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-sm border border-line bg-surface text-meta font-bold text-navy",
        className,
      )}
    >
      {monogram(name)}
    </span>
  );
}
