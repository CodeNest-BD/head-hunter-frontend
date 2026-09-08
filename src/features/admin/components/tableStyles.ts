/**
 * Shared class names for the admin data tables. Clean, reference-style rows:
 * a neutral-gray header, white body rows with only horizontal separators (no
 * vertical column rules, no zebra striping), and a subtle hover.
 */

export const TABLE_CLASS = "w-full border-collapse text-sm";

export const THEAD_ROW_CLASS =
  "text-left text-[11px] uppercase tracking-wider text-[#616676] " +
  // Neutral-gray header (#F1F3F5). Deliberately NOT sticky: the directory
  // tables live in an `overflow-x-auto` card so wide ones scroll horizontally,
  // and that wrapper is its own scroll container — a page-level `sticky top-16`
  // would then reserve a 64px gap inside it and hide the first row behind the
  // header (exactly the bug this replaces).
  "[&>th]:border-b [&>th]:border-brand-line [&>th]:bg-[#F1F3F5]";

export const BODY_ROW_CLASS =
  "border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/50";

export const TH_CLASS = "px-5 py-3 font-semibold";

export const TD_CLASS = "px-5 py-3";
