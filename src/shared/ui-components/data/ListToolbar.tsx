"use client";

import { Search } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { SearchableSelect } from "@/shared/ui-components/controls/SearchableSelect";
import {
  MobileFilters,
  type FilterConfig,
  type FilterOption,
} from "./MobileFilters";

export type { FilterConfig, FilterOption } from "./MobileFilters";

interface ToolbarSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Height in the toolbar's own 38px rhythm; `sm` is the 36px canvas form. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * The reference's `.search`: the icon lives inside the bordered box rather
 * than floated over a plain input, so the whole control is one unit and lines
 * up with the selects beside it.
 */
export function ToolbarSearch({
  value,
  onChange,
  placeholder,
  size = "md",
  className,
}: ToolbarSearchProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-sm border border-line-strong bg-surface px-[11px] transition-colors focus-within:border-blue focus-within:shadow-focus",
        size === "md" ? "h-9.5" : "h-9",
        className,
      )}
    >
      <Search className="size-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full border-0 bg-transparent text-sub text-ink outline-none placeholder:text-ink-faint"
      />
    </label>
  );
}

interface ToolbarSelectProps {
  /** Accessible name — the visible text is the current value, not a label. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The "no filter" option, e.g. "All verification". Its value is "". */
  allLabel: string;
  options: readonly FilterOption[];
  className?: string;
}

/**
 * A filter select on a table toolbar. It colours itself when it is narrowing
 * the list, so a reader scanning a row of four can tell at a glance which ones
 * are doing something — without that, an unexpected result count looks like
 * missing data rather than an applied filter.
 */
export function ToolbarSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
  className,
}: ToolbarSelectProps) {
  const active = value !== "";
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-9.5 w-auto text-sub",
        active && "border-blue/35 bg-tint/60 font-medium text-blue-ink",
        className,
      )}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}

interface ToolbarSearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  /** The "no filter" entry, e.g. "All jobs". Its value is "". */
  allLabel: string;
  options: readonly FilterOption[];
  /** Placeholder inside the dropdown's search box. */
  searchPlaceholder: string;
  className?: string;
}

/**
 * `ToolbarSelect` for option lists too long to scroll — every job, company or
 * recruiter on the marketplace. Same value convention ("" = no filter) and the
 * same active colouring, over the type-to-filter `SearchableSelect`.
 */
export function ToolbarSearchableSelect({
  value,
  onChange,
  allLabel,
  options,
  searchPlaceholder,
  className,
}: ToolbarSearchableSelectProps) {
  const active = value !== "";
  return (
    <SearchableSelect
      value={active ? value : null}
      onChange={(next) => onChange(next ?? "")}
      options={options}
      placeholder={allLabel}
      clearLabel={allLabel}
      searchPlaceholder={searchPlaceholder}
      maxResults={100}
      contentClassName="w-[360px]"
      className={cn(
        // `text-ink` overrides the trigger's faint placeholder colour: "All
        // jobs" is a real choice here, as it is on `ToolbarSelect`.
        "h-9.5 w-[200px] text-sub text-ink",
        active && "border-blue/35 bg-tint/60 font-medium text-blue-ink",
        className,
      )}
    />
  );
}

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
 * The reference's `.toolbar` for tables that filter from their column headers:
 * a search box capped at 360px, with the phone-only filter control beside it.
 *
 * A table whose filters sit on the toolbar itself (the recruiter directory)
 * composes `ToolbarSearch` and `ToolbarSelect` directly instead.
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
        <ToolbarSearch
          value={query}
          onChange={onQueryChange}
          placeholder={placeholder}
          size="sm"
          className="flex-1"
        />
      </div>
      {/* A sibling of the search row, not a child of it: its expanded selects
          are full-width rows, and nested in that `items-center` row they would
          resolve their width against a shrink-to-fit column beside the search
          box — squeezing the input and stacking the selects into a sliver. */}
      <MobileFilters filters={filters} />
    </div>
  );
}
