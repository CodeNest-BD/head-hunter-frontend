interface TableSkeletonProps {
  /** Number of placeholder rows beneath the header bar. */
  rows?: number;
}

/** Placeholder table shown while list data loads: a header bar, then `rows`
 * rows of two text bars and a trailing badge-shaped bar. */
export function TableSkeleton({ rows = 4 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface shadow-e1">
      <div className="h-9.5 w-full animate-pulse bg-surface-sub" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex h-11 items-center gap-4 border-t border-line px-3.5"
        >
          <div className="h-3.5 w-1/3 animate-pulse rounded-xs bg-surface-sunken" />
          <div className="h-3.5 w-1/4 animate-pulse rounded-xs bg-surface-sunken" />
          <div className="ml-auto h-5.25 w-20 animate-pulse rounded-full bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}
