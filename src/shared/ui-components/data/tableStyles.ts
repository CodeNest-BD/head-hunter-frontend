/**
 * Shared class strings for the app's plain data tables (recruiter submissions,
 * company inbox). A table MUST sit on its own white surface — the dashboard
 * canvas is a blue tint (`bg-secondary`), so a table without `bg-card` blends
 * into the page and loses all contrast. These constants keep every table on a
 * white card with a distinct header band and clear row separators.
 */

/** The white card the table lives in. */
export const TABLE_CARD =
  "overflow-hidden rounded-2xl border border-brand-line bg-card shadow-card";

/** Wrap the <table> in this for horizontal scroll on narrow screens. */
export const TABLE_SCROLL = "overflow-x-auto";

export const TABLE_EL = "w-full border-collapse text-sm";

/** Header band — tinted so it reads distinctly from the white body rows. */
export const TABLE_HEAD = "bg-secondary text-left";
export const TABLE_HEAD_ROW =
  "text-[11px] font-semibold uppercase tracking-wider text-brand-gray";
export const TABLE_TH = "px-5 py-3.5";

/** Body: white rows with hairline separators and a subtle hover. */
export const TABLE_BODY = "divide-y divide-border bg-card";
export const TABLE_ROW = "transition-colors hover:bg-secondary/60";
export const TABLE_TD = "px-5 py-4 align-middle";
