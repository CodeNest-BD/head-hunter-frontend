import { cn } from "@/shared/libs/shadCnConfig";

/**
 * Loading placeholder for the inbox candidate rail. Its blocks trace the
 * loaded rail's real shape — name and status, the two negotiation badges, the
 * fields grid, an overview paragraph, one attachment row and the action
 * buttons — so the panel doesn't lurch when `useCandidate` resolves. Fills the
 * rail's height (`lg:h-full`) exactly like the card it stands in for.
 */
export function CandidateRailSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm lg:h-full",
        className,
      )}
    >
      {/* Name + contact line, with the status pill to the right. */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-52 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Interview + offer state badges. */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-7 w-2/3 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Fields grid: a label above a value, repeated. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Overview paragraph. */}
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
      </div>

      {/* One attachment row. */}
      <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />

      {/* Action buttons. */}
      <div className="flex gap-2 border-t border-border/60 pt-3">
        <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
