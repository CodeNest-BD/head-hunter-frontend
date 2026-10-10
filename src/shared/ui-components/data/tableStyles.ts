/**
 * Shared class strings for the app's data tables.
 *
 * Measured off the phase-2 admin redesign (`requirements/phase-2-rifat-design`,
 * the Recruiters / Companies / Jobs boards), token for token:
 *
 *   card    white, 12px radius, 1px 6% ring + 1px drop — no border
 *   head    40px, #F7F9FC, 11px/600 uppercase 0.06em in #64748B,
 *           ruled above AND below with #E6EAF0
 *   row     60px, ruled with the lighter #F0F2F6
 *   gutter  20px on the row's outer edges, 12px between cells
 *
 * The head's rules and the row's rules are inset shadows rather than borders:
 * the head sticks, and a real border scrolls away from the cell it belongs to
 * while the body moves under it.
 */

/** The surface a table sits on — a ring, never a border. */
export const TABLE_CARD = "overflow-hidden rounded-lg bg-surface shadow-e1";

/**
 * Horizontal only, so a wide table scrolls sideways inside its card instead of
 * widening the page. The page keeps the vertical scroll.
 */
export const TABLE_SCROLL = "w-full overflow-x-auto";

export const TABLE_EL = "w-full border-separate border-spacing-0 text-sub";

export const TABLE_HEAD = "text-left";

/**
 * The header band. It sticks, so a long board keeps its column names — which
 * is why its rules are inset shadows rather than borders.
 */
export const TABLE_TH =
  "sticky top-0 z-[1] h-10 whitespace-nowrap bg-surface-head px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted shadow-[inset_0_-1px_0_theme(colors.line.head),inset_0_1px_0_theme(colors.line.head)] first:pl-5 last:pr-5";

export const TABLE_BODY = "bg-surface";
export const TABLE_ROW = "transition-colors hover:bg-surface-sub";

/**
 * An unread row: a brand wash with a matching hover. Pair it with
 * `TABLE_TD_RAIL` on the row's FIRST cell — an inset box-shadow on a `<tr>`
 * does not render reliably across browsers, so the rail belongs on a cell.
 */
export const TABLE_ROW_UNREAD = "bg-unread bg-unread-hover transition-colors";
/** The brand edge marking an unread row. Goes on the row's first `<td>`. */
export const TABLE_TD_RAIL = "shadow-rail";

/** 60px rows on the lighter rule, 20px outer gutters. */
export const TABLE_TD =
  "h-15 px-3 align-middle text-ink-body shadow-[inset_0_-1px_0_theme(colors.line.row)] first:pl-5 last:pr-5";

/**
 * A two-line cell (a name over its email). It keeps the row's height and only
 * tightens the leading, so a stacked row sits on the same rhythm as a plain
 * one.
 */
export const TABLE_TD_STACKED = `${TABLE_TD} leading-[1.35]`;

/** The primary value in a cell, and its quiet second line. */
export const TABLE_CELL_MAIN = "font-medium text-ink";
export const TABLE_CELL_SUB = "text-meta text-ink-muted";

/**
 * The toolbar strip above the rows, INSIDE the card — the design puts the
 * search, the filters and the column picker on the table's own surface rather
 * than on a separate bar floating above it.
 */
export const TABLE_TOOLBAR = "flex flex-wrap items-center gap-2 px-5 py-3.5";

/** The card's foot: the range readout on the left, paging on the right. */
export const TABLE_FOOT =
  "flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sub text-ink-muted";
