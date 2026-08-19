/**
 * Shared class names for the admin data tables. Clean, reference-style rows:
 * a neutral-gray sticky header, white body rows with only horizontal
 * separators (no vertical column rules, no zebra striping), and a subtle
 * hover — identical to the app's shared table shell.
 */

export const TABLE_CLASS = "w-full border-collapse text-sm";

export const THEAD_ROW_CLASS =
  "text-left text-[11px] uppercase tracking-wider text-[#616676] " +
  // Neutral-gray header (#F1F3F5), pinned under the fixed top bar on page
  // scroll, with a solid fill so rows never bleed through while it's pinned.
  "[&>th]:sticky [&>th]:top-16 [&>th]:z-20 [&>th]:border-b [&>th]:border-brand-line [&>th]:bg-[#F1F3F5]";

export const BODY_ROW_CLASS =
  "border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/50";

export const TH_CLASS = "px-5 py-3 font-semibold";

export const TD_CLASS = "px-5 py-3";
