/**
 * Shared class names for the admin data tables. Clean, reference-style rows:
 * a light sticky header, white body rows with only horizontal separators
 * (no vertical column rules, no zebra striping), and a subtle hover.
 */

export const TABLE_CLASS = "w-full border-collapse text-sm";

export const THEAD_ROW_CLASS =
  "text-left text-xs uppercase tracking-[0.08em] text-muted-foreground " +
  // Each header cell sticks to the top of the scroll area with its own solid
  // tint (a semi-transparent bg would let rows show through while pinned).
  // A step deeper than the page canvas (#EEF4FD) so the header stands out
  // instead of blending into the background.
  "[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:border-b [&>th]:border-border [&>th]:bg-[#DDE4F1]";

export const BODY_ROW_CLASS =
  "border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/50";

export const TH_CLASS = "px-5 py-3 font-semibold";

export const TD_CLASS = "px-5 py-3";
