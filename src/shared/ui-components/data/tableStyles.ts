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
 * `.tablecard` — the white card the table lives in. It clips to its own radius,
 * so the header band's square corners cannot poke past the rounded border and
 * neither the head nor the last row needs corner classes of its own. Safe
 * because every in-row menu (kebab, column picker, filter popover) renders
 * through a Radix portal and so escapes the clip.
 */
export const TABLE_CARD =
  "overflow-hidden rounded-md border border-line bg-surface shadow-e1";

/** `.toolbar` — the search/filter/columns row above a table. It sits directly
 * on the canvas in the reference, not on a card of its own. */
export const TABLE_TOOLBAR =
  "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center";

/**
 * `.tablecard__scroll` — horizontal only, so a wide table scrolls sideways
 * inside its card instead of widening the page. The page keeps the vertical
 * scroll.
 */
export const TABLE_SCROLL = "w-full overflow-x-auto";

export const TABLE_EL = "w-full border-collapse text-sub";

/**
 * `.table th` — a 38px band on the tinted sub-surface with 11px uppercase
 * labels in muted ink, distinct from both the white rows and the canvas.
 */
export const TABLE_HEAD = "text-left";
/**
 * The header band does NOT stick. It used to, pinned under the fixed top bar,
 * which only ever worked while no ancestor was a scroll container — and
 * `TABLE_SCROLL`'s `overflow-x` makes one, which re-parents a sticky element to
 * that box and leaves the header floating over the first rows. The reference
 * does not stick it either.
 */
export const TABLE_TH =
  "h-9.5 whitespace-nowrap border-b border-line bg-surface-sub px-3.5 text-label font-[650] uppercase tracking-[0.06em] text-ink-muted";

/** `.table td` — white 44px rows with hairline separators and a subtle hover;
 * the last row drops its rule, as the reference's `tr:last-child td` does. */
export const TABLE_BODY = "bg-surface [&>tr:last-child>td]:border-b-0";
export const TABLE_ROW = "transition-colors hover:bg-surface-sub";
/**
 * An unread row: a cobalt wash with a matching hover. The wash alone is 4.5%
 * and barely registers, so pair it with `TABLE_TD_RAIL` on the row's FIRST
 * cell — an inset box-shadow on a `<tr>` does not render reliably across
 * browsers, which is why the rail belongs on a cell rather than the row.
 */
export const TABLE_ROW_UNREAD = "bg-unread bg-unread-hover transition-colors";
/** The cobalt edge marking an unread row. Goes on the row's first `<td>`. */
export const TABLE_TD_RAIL = "shadow-rail";
export const TABLE_TD = "h-11 border-b border-line px-3.5 py-1.5 align-middle";
/**
 * `.cell-2l` — a two-line cell (title over its timestamp). It keeps the row's
 * own 6px padding and only tightens the leading: in the reference `.table td`
 * outranks `.cell-2l`, so the padding it declares never applies and a stacked
 * row is the same height there as here.
 */
export const TABLE_TD_STACKED =
  "border-b border-line px-3.5 py-1.5 align-middle leading-[1.3]";
/** `.cell-main` / `.cell-sub` — the primary value and its quiet second line. */
export const TABLE_CELL_MAIN = "font-semibold text-ink";
export const TABLE_CELL_SUB = "mt-px text-[11.5px] text-ink-faint";
