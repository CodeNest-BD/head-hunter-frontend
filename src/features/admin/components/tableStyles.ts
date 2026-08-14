/**
 * Shared class names for the admin data tables so every list renders with the
 * same professional treatment: a tinted header, zebra striping, hover feedback
 * and thin vertical rules between columns.
 */

export const TABLE_CLASS = "w-full border-collapse text-sm";

export const THEAD_ROW_CLASS =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground " +
  "[&>th]:border-l [&>th]:border-border/50 [&>th:first-child]:border-l-0";

export const BODY_ROW_CLASS =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50 " +
  "[&>td]:border-l [&>td]:border-border/40 [&>td:first-child]:border-l-0";

export const TH_CLASS = "px-5 py-3 font-semibold";

export const TD_CLASS = "px-5 py-3";
