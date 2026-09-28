"use client";

import { Search } from "lucide-react";

import { MobileFilters, type FilterConfig } from "./MobileFilters";

export type { FilterConfig, FilterOption } from "./MobileFilters";

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  /**
   * The same filters the column headers carry, rendered for phones only — see
   * `MobileFilters`. They share the caller's state with the column filters, so
   * the two presentations can never disagree.
   */
  filter?: FilterConfig;
  /** A second dropdown (e.g. a category beside a status filter). */
  extraFilter?: FilterConfig;
}

/**
 * The reference's `.toolbar`: a 36px `.search` box capped at 360px, sitting
 * directly on the canvas above a table. Shared by every table (admin /
 * recruiter / company) so search looks and behaves identically everywhere.
 *
 * Filtering lives in the column headers from `sm` up; below it the phone-only
 * control beside the search box carries the same filters.
 */
export function ListToolbar({
  query,
  onQueryChange,
  placeholder,
  filter,
  extraFilter,
}: ListToolbarProps) {
  const filters = [filter, extraFilter].filter(
    (config): config is FilterConfig => config !== undefined,
  );

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
        <MobileFilters filters={filters} />
      </div>
    </div>
  );
}
