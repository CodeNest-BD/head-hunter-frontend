import { Card, CardContent } from "@/shared/ui-components/controls/card";

/** Label + value stack used across the admin detail cards. */
export function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="break-words text-sm text-navy">{value || "—"}</span>
    </div>
  );
}

export function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

/** Skeleton shown while an admin detail page loads. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="h-36 animate-pulse p-6" />
          </Card>
        ))}
      </div>
    </div>
  );
}
