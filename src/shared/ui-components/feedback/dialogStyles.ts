/**
 * The one modal shell, shared by every dialog in the app.
 *
 * These strings were copied from dialog to dialog and drifted: some panels came
 * out at a 10px radius and some at 12px, padding varied between 16px and 20px,
 * and the width was written as both `calc(100vw-2rem)` and `calc(100%-2rem)` —
 * which are not the same thing once a dialog is nested inside a positioned
 * ancestor. Keeping them here means a modal cannot quietly differ from its
 * neighbour.
 *
 * Radix owns the positioning; these only describe the surface.
 */

/** The scrim. Navy at 40%, so the page reads as pushed back rather than dimmed
 * to grey. */
export const DIALOG_OVERLAY = "fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm";

/** The panel, without padding — for a dialog that rules a header and footer off
 * from a scrolling body and so pads each band itself. */
export const DIALOG_PANEL =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface shadow-pop focus:outline-none";

/** The panel for a dialog that is a single block of content. */
export const DIALOG_PANEL_PADDED = `${DIALOG_PANEL} p-5`;

/** Header / body / footer bands, for the panels that have them. */
export const DIALOG_HEADER =
  "flex shrink-0 items-center gap-3 border-b border-line px-4 py-3";
export const DIALOG_BODY = "p-4";
export const DIALOG_FOOTER =
  "flex shrink-0 items-center gap-2 border-t border-line px-4 py-2.5";

/** `.t-card` on full-strength ink — every dialog title. */
export const DIALOG_TITLE = "text-card font-[650] text-ink";
export const DIALOG_DESCRIPTION = "mt-1.5 text-sub text-ink-muted";
