/**
 * Shared class strings for the app's plain data tables (recruiter submissions,
 * company inbox). A table MUST sit on its own white surface — the dashboard
 * canvas is a blue tint (`bg-secondary`), so a table without `bg-card` blends
 * into the page and loses all contrast. These constants keep every table on a
 * white card with a distinct header band and clear row separators.
 */

/**
 * The white card the table lives in. No `overflow-hidden` — that would clip
 * the page-level sticky header. Rounded corners still read fine because the
 * header spans the full width with its own solid fill.
 */
export const TABLE_CARD =
  "rounded-2xl border border-brand-line bg-card shadow-card";

/** White card wrapping the search/filter/columns toolbar above a table. */
export const TABLE_TOOLBAR =
  "flex flex-col gap-3 rounded-2xl border border-brand-line bg-card p-3 shadow-card sm:flex-row sm:items-center";

/**
 * Table wrapper. Deliberately NOT an overflow container: an `overflow` here
 * would become the scroll port and break the page-level sticky header. The
 * page (body) scrolls instead, so the vertical scrollbar belongs to the page
 * and tracks the rows rather than spanning the header.
 */
export const TABLE_SCROLL = "w-full";

export const TABLE_EL = "w-full border-collapse text-sm";

/** Dark header band (#0A1738) with light text — pinned under the top bar. */
export const TABLE_HEAD = "text-left";
export const TABLE_HEAD_ROW =
  "text-[11px] font-semibold uppercase tracking-wider text-white/70";
/**
 * Each header cell is sticky (page scroll) below the fixed top bar, with a
 * solid dark fill so rows never bleed through while it's pinned.
 */
export const TABLE_TH =
  "sticky top-16 z-20 border-b border-white/10 bg-[#0A1738] px-5 py-3.5";

/** Body: white rows with hairline separators and a subtle hover. */
export const TABLE_BODY = "divide-y divide-border bg-card";
export const TABLE_ROW = "transition-colors hover:bg-secondary/60";
export const TABLE_TD = "px-5 py-4 align-middle";
