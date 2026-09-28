"use client";

import { useState, type ReactNode } from "react";
import { Check, ListFilter, Search } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";

import { TABLE_TH } from "./tableStyles";

export interface ColumnFilterOption {
  value: string;
  label: string;
}

/** Past this many options the popover grows its own search box. */
const SEARCHABLE_THRESHOLD = 8;

interface ColumnFilterProps {
  /** The column's name — drives the accessible label, not the visible text. */
  label: string;
  options: readonly ColumnFilterOption[];
  /** `null` means no filter is applied. */
  value: string | null;
  onChange: (next: string | null) => void;
  /**
   * Force the search box on or off. Left unset, it appears once the list is
   * long enough to be worth searching.
   */
  searchable?: boolean;
}

/**
 * The filter control every data table shares: a `ListFilter` icon in the column
 * header opening a single-select list, tinted once a value is picked, with a
 * Clear row at the foot.
 *
 * Deliberately presentational — the selection is handed straight back, so the
 * table that owns the query decides what to do with it. Every consumer maps it
 * to a request param rather than filtering rows in the browser, so a filter
 * narrows the whole result set instead of just the page on screen.
 */
export function ColumnFilter({
  label,
  options,
  value,
  onChange,
  searchable,
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const active = value !== null;
  const withSearch = searchable ?? options.length > SEARCHABLE_THRESHOLD;
  const shown = withSearch
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  const select = (next: string | null) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            active ? `Filter by ${label} (filtered)` : `Filter by ${label}`
          }
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-xs transition-colors",
            active
              ? "bg-tint text-blue"
              : "text-ink-faint hover:bg-surface-sunken hover:text-ink",
          )}
        >
          <ListFilter className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        {withSearch && (
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
              />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                aria-label={`Search ${label}`}
                className="h-7.5 w-full rounded-sm border border-line-strong bg-surface pl-7 pr-2 text-meta text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-blue focus-visible:shadow-focus"
              />
            </div>
          </div>
        )}
        <div className="max-h-56 overflow-y-auto p-1">
          {shown.length === 0 ? (
            <p className="px-2 py-3 text-center text-meta text-ink-muted">
              No matches
            </p>
          ) : (
            shown.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => select(option.value)}
                className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-meta text-ink-body transition-colors hover:bg-surface-sub"
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {value === option.value && (
                    <Check className="size-3.5 text-blue" />
                  )}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
        {active && (
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={() => select(null)}
              className="w-full rounded-xs px-2 py-1.5 text-left text-meta font-[550] text-blue-ink transition-colors hover:bg-surface-sub"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * A header cell that carries its column's filter beside the label, so every
 * table puts the control in the same place relative to the heading.
 */
export function FilterableHead({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <th scope="col" className={cn(TABLE_TH, className)}>
      <span className="inline-flex items-center gap-1.5">
        {label}
        {children}
      </span>
    </th>
  );
}
