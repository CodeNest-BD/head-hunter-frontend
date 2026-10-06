/**
 * Shared class strings for the app's data tables.
 *
 * The metrics are fh-core's `.fh-data-table`, expressed in this app's tokens:
 * a 40px header band of 11px/600 uppercase micro-labels on the tinted
 * sub-surface, 13px body cells on an 8px/12px rhythm, 16px gutters on the
 * outer edges of each row, hairline separators both between rows and between
 * columns, and a muted hover tint.
 *
 * A table MUST sit on its own white surface — the canvas is a blue-grey tint,
 * so a table without `bg-surface` blends into the page and loses all contrast.
 *
 * Everything here is a utility rather than a stylesheet rule, so a call site
 * can still override a single cell's alignment, colour or width by appending
 * its own class. Only the row gutters use a structural pseudo-class, and they
 * are the one thing no caller should be contradicting.
 */

/**
 * `.tablecard` — the white card the table lives in. It clips to its own radius,
 * so the header band's square corners cannot poke past the rounded border and
 * neither the head nor the last row needs corner classes of its own. Safe
 * because every in-row menu (kebab, column picker) renders through a Radix
 * portal and so escapes the clip.
 */
export const TABLE_CARD =
  "overflow-hidden rounded-md border border-line bg-surface shadow-e1";

/**
 * `.tablecard__scroll` — horizontal only, so a wide table scrolls sideways
 * inside its card instead of widening the page. The page keeps the vertical
 * scroll.
 */
export const TABLE_SCROLL = "w-full overflow-x-auto";

/**
 * What every cell in a row shares, head and body alike: a 16px gutter on the
 * row's outer edges, and a hairline between columns.
 *
 * The column hairline is deliberately softer than the row rule — it guides the
 * eye across a wide table without turning it into a spreadsheet — and stops
 * before the last column, where the card's own border closes the row.
 *
 * Both edges are pseudo-class variants, so they outrank the `px-3` they sit
 * beside however the strings are ordered, and a call site adding its own
 * alignment or colour cannot accidentally knock them out.
 */
const CELL_EDGES =
  "first:pl-4 last:pr-4 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-r-line/70";

/**
 * 13px/1.4 — compact, and the size every figure and label in a row is measured
 * against.
 *
 * `border-separate` with zero spacing rather than `border-collapse`: collapsing
 * merges each cell's hairline with its neighbour's, which makes the row rule
 * and the column rule fight over a single shared pixel and leaves the lighter
 * of the two invisible. Separated borders let the row rule and the softer
 * column rule each draw their own.
 */
export const TABLE_EL =
  "w-full border-separate border-spacing-0 text-[13px] leading-[1.4]";

export const TABLE_HEAD = "text-left";

/**
 * `.table th` — a 40px band on the tinted sub-surface carrying 11px uppercase
 * micro-labels in muted ink, distinct from both the white rows and the canvas.
 *
 * The band does NOT stick. It used to, pinned under the fixed top bar, which
 * only ever worked while no ancestor was a scroll container — and
 * `TABLE_SCROLL`'s `overflow-x` makes one, which re-parents a sticky element to
 * that box and leaves the header floating over the first rows.
 */
export const TABLE_TH = `h-10 whitespace-nowrap border-b border-line bg-surface-sub px-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted ${CELL_EDGES}`;

/** `.table td` — white rows with hairline separators and a subtle hover; the
 * last row drops its rule, so the card's own border closes the table. */
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

/** The body cell's box: an 8px/12px rhythm, and the shared row edges. */
const CELL_BOX = `border-b border-line px-3 py-2 align-middle ${CELL_EDGES}`;

export const TABLE_TD = `${CELL_BOX} break-words text-ink-body`;

/**
 * `.cell-2l` — a two-line cell (title over its timestamp). It keeps the row's
 * own padding and only tightens the leading, so a stacked row sits on the same
 * rhythm as a plain one.
 */
export const TABLE_TD_STACKED = `${CELL_BOX} leading-[1.3]`;

/** `.cell-main` / `.cell-sub` — the primary value and its quiet second line. */
export const TABLE_CELL_MAIN = "font-semibold text-ink";
export const TABLE_CELL_SUB = "mt-px text-[11.5px] text-ink-faint";
