import { cn } from "@/shared/libs/shadCnConfig";

import { TABLE_CARD } from "./tableStyles";

/**
 * Bar widths for the text cells, cycled so a skeleton's columns read as
 * different values rather than a row of identical blocks. The first two are
 * the widths every table skeleton in the app has always used.
 */
const CELL_WIDTHS: readonly string[] = [
  "w-1/3",
  "w-1/4",
  "w-1/5",
  "w-2/5",
  "w-1/6",
];

interface TableSkeletonProps {
  /** Number of placeholder rows beneath the header bar. */
  rows?: number;
  /**
   * Cells per row, so the skeleton matches the table it stands in for. The
   * last cell is the trailing badge; the rest are text bars.
   */
  columns?: number;
  /** Overrides on the card, e.g. for a skeleton nested inside another card. */
  className?: string;
}

/** Placeholder table shown while list data loads: a header bar, then `rows`
 * rows of text bars and a trailing badge-shaped bar. */
export function TableSkeleton({
  rows = 4,
  columns = 3,
  className,
}: TableSkeletonProps) {
  const textCells = Math.max(columns - 1, 1);
  return (
    <div className={cn(TABLE_CARD, className)}>
      {/* The 40px header band, then rows on the table's own 8px/12px
          rhythm, so nothing shifts when the data lands. */}
      <div className="h-10 w-full animate-pulse bg-surface-sub" />
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex h-9 items-center gap-4 border-t border-line px-4"
        >
          {Array.from({ length: textCells }).map((_, cell) => (
            <div
              key={cell}
              className={cn(
                "h-3.5 animate-pulse rounded-xs bg-surface-sunken",
                CELL_WIDTHS[cell % CELL_WIDTHS.length],
              )}
            />
          ))}
          <div className="ml-auto h-5.25 w-20 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}
