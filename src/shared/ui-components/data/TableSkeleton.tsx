interface TableSkeletonProps {
  /** Number of placeholder rows beneath the header bar. */
  rows?: number;
}

/** Placeholder table shown while list data loads: a header bar, then `rows`
 * rows of two text bars and a trailing badge-shaped bar. */
export function TableSkeleton({ rows = 4 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-card">
      <div className="h-11 w-full animate-pulse bg-muted/50" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-t border-border/60 px-4 py-3.5"
        >
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
