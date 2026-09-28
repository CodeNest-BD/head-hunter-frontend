/**
 * Shared class strings for the app's data tables, ported from the reference's
 * `.tablecard` / `.table` / `.pager`.
 *
 * A table MUST sit on its own white surface — the canvas is a blue-grey tint,
 * so a table without `bg-surface` blends into the page and loses all contrast.
 * These constants keep every table on the same white card with a tinted header
 * band, 38px header row, 44px body rows and hairline separators, so every table
 * in the app reads identically.
 */

/**
 * `.tablecard` — the white card the table lives in. No `overflow-hidden`: that
 * would clip the page-level sticky header. Instead of clipping to the card's
 * `rounded-md` corners, the header row and the last body row round their own
 * outer corners to match (see TABLE_HEAD_ROW / TABLE_BODY). Without that the
 * header band's square corners poke past the rounded border.
 */
export const TABLE_CARD = "rounded-md border border-line bg-surface shadow-e1";

/** `.toolbar` — the search/filter/columns row above a table. It sits directly
 * on the canvas in the reference, not on a card of its own. */
export const TABLE_TOOLBAR =
  "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center";

/**
 * `.tablecard__scroll`. Deliberately NOT a vertical overflow container: an
 * `overflow-y` here would become the scroll port and break the page-level
 * sticky header. The page (body) scrolls instead, so the vertical scrollbar
 * belongs to the page and tracks the rows rather than spanning the header.
 */
export const TABLE_SCROLL = "w-full overflow-x-auto";

export const TABLE_EL = "w-full border-collapse text-sub";

/**
 * `.table th` — a 38px band on the tinted sub-surface with 11px uppercase
 * labels in muted ink, distinct from both the white rows and the canvas.
 */
export const TABLE_HEAD = "text-left";
// Round the outer top corners of the header band to match the card, since the
// card can't clip with overflow-hidden (it would break the sticky header).
export const TABLE_HEAD_ROW =
  "[&>th:first-child]:rounded-tl-md [&>th:last-child]:rounded-tr-md";
/**
 * Each header cell is sticky (page scroll) below the fixed 56px top bar, with a
 * solid fill so rows never bleed through while it's pinned.
 */
export const TABLE_TH =
  "sticky top-topbar z-20 h-9.5 whitespace-nowrap border-b border-line bg-surface-sub px-3.5 text-label font-[650] uppercase tracking-[0.06em] text-ink-muted";

/** `.table td` — white 44px rows with hairline separators and a subtle hover.
 * The last row rounds its outer bottom corners so a row hover never squares off
 * the card. */
export const TABLE_BODY =
  "bg-surface [&>tr:last-child>td]:border-b-0 [&>tr:last-child>td:first-child]:rounded-bl-md [&>tr:last-child>td:last-child]:rounded-br-md";
export const TABLE_ROW = "transition-colors hover:bg-surface-sub";
/** An unread row: a cobalt wash with a matching hover. */
export const TABLE_ROW_UNREAD = "bg-unread bg-unread-hover transition-colors";
export const TABLE_TD = "h-11 border-b border-line px-3.5 py-1.5 align-middle";
/** `.cell-2l` — a two-line cell (title over its timestamp) needs more room. */
export const TABLE_TD_STACKED =
  "border-b border-line px-3.5 py-2 align-middle leading-[1.3]";
/** `.cell-main` / `.cell-sub` — the primary value and its quiet second line. */
export const TABLE_CELL_MAIN = "font-semibold text-ink";
export const TABLE_CELL_SUB = "mt-px text-[11.5px] text-ink-faint";
