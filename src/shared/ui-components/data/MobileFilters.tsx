"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  /** `""` means unfiltered — the shape the tables' query state already uses. */
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** The option that clears the filter, e.g. "All statuses". */
  allLabel: string;
}

// Radix Select forbids an empty-string item value, so "all" is the sentinel for
// "no filter" and maps to/from the empty string the query state uses.
const ALL = "all";

/**
 * A table's filters, for phones only.
 *
 * From `sm` up, filtering lives in the column headers. Below it the table is
 * replaced by a card list, which has no header row to hang a filter off — so
 * without this a filter is simply unreachable on a phone. The configs are the
 * caller's own filter state, the same state the column filters write to, so the
 * two presentations cannot disagree.
 *
 * Collapsed behind a toggle, because three full-width selects above a card list
 * outweigh the list. The toggle carries a count of the filters currently
 * applied: one silently narrowing the list is worse than no filter at all.
 */
export function MobileFilters({
  filters,
  className,
}: {
  filters: readonly FilterConfig[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (filters.length === 0) return null;

  const appliedCount = filters.filter((config) => config.value !== "").length;

  return (
    <div className={cn("flex flex-col gap-2 sm:hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-sm border px-3 text-sub font-semibold transition-colors",
          appliedCount > 0
            ? "border-blue bg-tint text-blue-ink"
            : "border-line-strong bg-surface text-ink",
        )}
      >
        <SlidersHorizontal className="size-[15px]" />
        Filters
        {appliedCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue px-1 text-[10px] font-bold leading-none text-white">
            {appliedCount}
          </span>
        )}
      </button>
      {open &&
        filters.map((config) => (
          <FilterSelect key={config.allLabel} config={config} />
        ))}
    </div>
  );
}

export function FilterSelect({
  config,
  className,
}: {
  config: FilterConfig;
  className?: string;
}) {
  return (
    <Select
      value={config.value === "" ? ALL : config.value}
      onValueChange={(next) => config.onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger
        className={cn("w-full sm:w-auto sm:min-w-[140px]", className)}
        aria-label={config.allLabel}
      >
        <SelectValue placeholder={config.allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{config.allLabel}</SelectItem>
        {config.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
