"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Input } from "@/shared/ui-components/controls/input";
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
  filter?: FilterConfig;
  /** A second dropdown (e.g. a category beside a status filter). */
  extraFilter?: FilterConfig;
}

// Radix Select forbids an empty-string item value, so "all" is the sentinel for
// "no filter" and maps to/from the empty string the query state uses.
const ALL = "all";

/**
 * Search box + optional filter dropdowns for a data table. Shared by every
 * table (admin / recruiter / company) so search + filter look and behave
 * identically across the platform.
 *
 * On a phone the dropdowns would stack into three full-width rows above the
 * list and outweigh it, so they collapse behind a Filters toggle and the
 * search box keeps the row to itself. The toggle carries a count of the
 * filters currently applied — a collapsed filter that is silently narrowing
 * the list is worse than no filter at all.
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
  const hiddenOnMobile = filtersOpen ? undefined : "hidden sm:flex";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="pl-10"
            aria-label="Search"
          />
        </div>
        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-colors sm:hidden",
              appliedCount > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-input text-navy",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {appliedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                {appliedCount}
              </span>
            )}
          </button>
        )}
      </div>
      {filter && <FilterSelect config={filter} className={hiddenOnMobile} />}
      {extraFilter && (
        <FilterSelect config={extraFilter} className={hiddenOnMobile} />
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
        className={cn("w-full sm:w-[180px]", className)}
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
