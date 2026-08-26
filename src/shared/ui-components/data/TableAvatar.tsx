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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-extrabold text-primary",
        className,
      )}
    >
      {monogram(name)}
    </span>
  );
}
