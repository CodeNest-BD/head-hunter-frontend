import { PublicShell } from "./PublicShell";

/**
 * A stand-in for marketing/support routes that are linked from the nav but have
 * no content yet. Keeps the link working (and the chrome consistent) instead of
 * 404-ing, until the real page is specified.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center gap-2 px-6 py-20 text-center">
        <h1 className="text-[30px] font-extrabold tracking-[-0.022em] text-navy">
          {title}
        </h1>
        <p className="text-sub text-ink-muted">No requirement yet.</p>
      </div>
    </PublicShell>
  );
}
