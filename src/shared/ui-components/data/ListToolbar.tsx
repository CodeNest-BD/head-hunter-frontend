"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

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

interface FilterConfig {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel: string;
}

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  /**
   * The same filters the column headers carry, for phones only.
   *
   * Below `sm` the table is replaced by a card list, so there is no header row
   * to hang a filter off — without these, a filter would simply be unreachable
   * on a phone. They share the caller's state with the column filters, so the
   * two presentations can never disagree.
   */
  filter?: FilterConfig;
  /** A second dropdown (e.g. a category beside a status filter). */
  extraFilter?: FilterConfig;
}

// Radix Select forbids an empty-string item value, so "all" is the sentinel for
// "no filter" and maps to/from the empty string the query state uses.
const ALL = "all";

/**
 * The reference's `.toolbar`: a 36px `.search` box capped at 360px, sitting
 * directly on the canvas above a table. Shared by every table (admin /
 * recruiter / company) so search looks and behaves identically everywhere.
 *
 * On desktop, filtering lives in the column headers. A phone has no header row
 * to put it in — the table becomes a card list — so the same filters appear
 * here instead, collapsed behind a Filters toggle so they do not outweigh the
 * list. The toggle carries a count of the filters currently applied: a
 * collapsed filter silently narrowing the list is worse than no filter at all.
 */
export function ListToolbar({
  query,
  onQueryChange,
  placeholder,
  filter,
  extraFilter,
}: ListToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = [filter, extraFilter].filter(
    (config): config is FilterConfig => config !== undefined,
  );
  const appliedCount = filters.filter((config) => config.value !== "").length;
  // Mobile-only: the column headers own filtering from `sm` up.
  const mobileOnly = filtersOpen ? "flex sm:hidden" : "hidden";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-1 items-center gap-2 sm:max-w-[360px]">
        {/* `.search` — the icon lives inside the bordered box, not floated over
            a plain input, so the whole control is one 36px unit. */}
        <label className="flex h-9 flex-1 items-center gap-2 rounded-sm border border-line-strong bg-surface px-[11px] transition-colors focus-within:border-blue focus-within:shadow-focus">
          <Search
            className="size-3.5 shrink-0 text-ink-faint"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            aria-label="Search"
            className="w-full border-0 bg-transparent text-sub text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border px-3 text-sub font-semibold transition-colors sm:hidden",
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
        )}
      </div>
      {filter && <FilterSelect config={filter} className={mobileOnly} />}
      {extraFilter && (
        <FilterSelect config={extraFilter} className={mobileOnly} />
      )}
    </div>
  );
}

function FilterSelect({
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
        aria-label="Filter"
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
