/**
 * Shared class strings for the app's plain data tables (recruiter submissions,
 * company inbox). A table MUST sit on its own white surface — the dashboard
 * canvas is a blue tint (`bg-secondary`), so a table without `bg-card` blends
 * into the page and loses all contrast. These constants keep every table on a
 * white card with a neutral-gray header band and clear row separators, so
 * every table in the app reads identically.
 */

/**
 * The white card the table lives in. No `overflow-hidden` — that would clip the
 * page-level sticky header — so instead of clipping to the card's `rounded-md`
 * corners, the header row and the last body row round their own outer corners to
 * match (see TABLE_HEAD_ROW / TABLE_BODY). Without that the gray header band's
 * square corners poke past the rounded border.
 */
export const TABLE_CARD =
  "rounded-md border border-brand-line bg-card shadow-card";

/** White card wrapping the search/filter/columns toolbar above a table. */
export const TABLE_TOOLBAR =
  "flex flex-col gap-3 rounded-md border border-brand-line bg-card p-3 shadow-card sm:flex-row sm:items-center";

/**
 * Table wrapper. Deliberately NOT an overflow container: an `overflow` here
 * would become the scroll port and break the page-level sticky header. The
 * page (body) scrolls instead, so the vertical scrollbar belongs to the page
 * and tracks the rows rather than spanning the header.
 */
export const TABLE_SCROLL = "w-full";

export const TABLE_EL = "w-full border-collapse text-sm";

/**
 * Neutral-gray header band (#F1F3F5) with muted-gray uppercase labels
 * (#616676) — distinct from both the white rows and the blue-tint canvas.
 */
export const TABLE_HEAD = "text-left";
// Round the outer top corners of the header band to match the card, since the
// card can't clip with overflow-hidden (it would break the sticky header).
export const TABLE_HEAD_ROW =
  "text-[11px] font-semibold uppercase tracking-wider text-[#616676] [&>th:first-child]:rounded-tl-md [&>th:last-child]:rounded-tr-md";
/**
 * Each header cell is sticky (page scroll) below the fixed top bar, with a
 * solid gray fill so rows never bleed through while it's pinned.
 */
export const TABLE_TH =
  "sticky top-16 z-20 border-b border-brand-line bg-[#F1F3F5] px-5 py-3";

/** Body: white rows with hairline separators and a subtle hover. The last row
 * rounds its outer bottom corners so a row hover never squares off the card. */
export const TABLE_BODY =
  "divide-y divide-border bg-card [&>tr:last-child>td:first-child]:rounded-bl-md [&>tr:last-child>td:last-child]:rounded-br-md";
export const TABLE_ROW = "transition-colors hover:bg-secondary/60";
export const TABLE_TD = "px-5 py-3.5 align-middle";
