/**
 * Shared class names for the admin data tables. Clean, reference-style rows:
 * a light sticky header, white body rows with only horizontal separators
 * (no vertical column rules, no zebra striping), and a subtle hover.
 */

export const TABLE_CLASS = "w-full border-collapse text-sm";

export const THEAD_ROW_CLASS =
  "text-left text-xs uppercase tracking-[0.08em] text-white/70 " +
  // Dark navy header (#0A1738), pinned under the fixed top bar on page scroll,
  // with a solid fill so rows never bleed through while it's pinned.
  "[&>th]:sticky [&>th]:top-16 [&>th]:z-20 [&>th]:border-b [&>th]:border-white/10 [&>th]:bg-[#0A1738]";

export const BODY_ROW_CLASS =
  "border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/50";

export const TH_CLASS = "px-5 py-3 font-semibold";

export const TD_CLASS = "px-5 py-3";
