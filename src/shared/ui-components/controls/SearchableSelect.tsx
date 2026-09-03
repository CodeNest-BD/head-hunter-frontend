"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { cn } from "@/shared/libs/shadCnConfig";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SearchableSelectProps {
  readonly options: readonly SelectOption[];
  /** The chosen value, or null when nothing (or the clear option) is selected. */
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  /** Trigger text when nothing is selected. */
  readonly placeholder?: string;
  /** Placeholder inside the search box. */
  readonly searchPlaceholder?: string;
  /**
   * When set, a top option with this label clears the selection (onChange(null)).
   * The filter panels use it for "All states" / "All cities"; the required form
   * pickers omit it so a state must be chosen.
   */
  readonly clearLabel?: string;
  /** Message when the search matches nothing. */
  readonly emptyMessage?: string;
  /**
   * Cap how many options render at once (long lists like per-state cities).
   * Typing still searches the whole set; a footer notes the truncation.
   */
  readonly maxResults?: number;
  readonly disabled?: boolean;
  /** Trigger text while disabled (e.g. "Select a state first"). */
  readonly disabledPlaceholder?: string;
  readonly id?: string;
  readonly className?: string;
}

/**
 * A searchable single-select: a select-styled trigger opening a filterable list
 * with a check on the current choice. The one primitive behind every state and
 * city picker in the app — built as a combobox (not a plain dropdown) because
 * even the 50-state list is faster to filter than to scroll, and per-state city
 * lists run into the thousands.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  clearLabel,
  emptyMessage = "No results found",
  maxResults,
  disabled,
  disabledPlaceholder,
  id,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const cap = maxResults ?? options.length;
    if (!needle) return options.slice(0, cap);
    const result: SelectOption[] = [];
    for (const option of options) {
      if (option.label.toLowerCase().includes(needle)) {
        result.push(option);
        if (result.length >= cap) break;
      }
    }
    return result;
  }, [options, query, maxResults]);

  const selectedLabel =
    value === null ? null : (options.find((o) => o.value === value)?.label ?? value);

  const commit = (next: string | null): void => {
    onChange(next);
    setOpen(false);
  };

  const truncated =
    !query && maxResults !== undefined && options.length > maxResults;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            selectedLabel === null && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1 text-left">
            {selectedLabel ??
              (disabled ? (disabledPlaceholder ?? placeholder) : placeholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- focus belongs on
              the search field the moment the combobox opens. */}
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
          {clearLabel !== undefined && (
            <Option
              label={clearLabel}
              selected={value === null}
              onSelect={() => commit(null)}
            />
          )}
          {matches.map((option) => (
            <Option
              key={option.value}
              label={option.label}
              selected={value === option.value}
              onSelect={() => commit(option.value)}
            />
          ))}
          {matches.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
          {truncated && (
            <p className="px-2 py-1.5 text-center text-xs text-muted-foreground">
              Showing first {maxResults} — type to search all{" "}
              {options.length.toLocaleString("en-US")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Option({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        selected && "bg-accent/50 font-medium",
      )}
    >
      <span className="line-clamp-1">{label}</span>
      {selected && <Check className="absolute right-2 h-4 w-4" />}
    </button>
  );
}
