import { cn } from "@/shared/libs/shadCnConfig";

/** Two-letter monogram from a name — the table-row avatar fallback. */
function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

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
