import { PublicShell } from "./PublicShell";

/**
 * A stand-in for marketing/support routes that are linked from the nav but have
 * no content yet. Keeps the link working (and the chrome consistent) instead of
 * 404-ing, until the real page is specified.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center gap-3 px-5 py-20 text-center">
        <h1 className="font-heading text-3xl font-extrabold text-navy">
          {title}
        </h1>
        <p className="text-muted-foreground">No requirement yet.</p>
      </div>
    </PublicShell>
  );
}
