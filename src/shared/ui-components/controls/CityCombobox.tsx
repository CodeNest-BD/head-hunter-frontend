"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { cn } from "@/shared/libs/shadCnConfig";

// Some states carry 1,000+ places, so we never render the whole list — only the
// first slice (or the matches while searching). Typing narrows to everything.
const MAX_RESULTS = 100;

interface CityComboboxProps {
  /** All places for the selected state, alphabetical. */
  cities: readonly string[];
  /** The chosen city, or null for "all cities". */
  value: string | null;
  onChange: (city: string | null) => void;
  disabled?: boolean;
  /** Extra classes for the trigger, e.g. to match a taller form's field height. */
  className?: string;
}

/**
 * A searchable city picker: a select-styled trigger opening a filterable list.
 * Built as a combobox (not a plain dropdown) because per-state lists are far too
 * long to scroll — filtering is the primary way to find a city.
 */
export function CityCombobox({
  cities,
  value,
  onChange,
  disabled,
  className,
}: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return cities.slice(0, MAX_RESULTS);
    }
    const result: string[] = [];
    for (const city of cities) {
      if (city.toLowerCase().includes(needle)) {
        result.push(city);
        if (result.length >= MAX_RESULTS) break;
      }
    }
    return result;
  }, [cities, query]);

  const select = (city: string | null): void => {
    onChange(city);
    setOpen(false);
  };

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
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1 text-left">
            {disabled ? "Select a state first" : (value ?? "All cities")}
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
            placeholder="Search cities…"
            aria-label="Search cities"
            className="h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div
          id={listId}
          role="listbox"
          className="max-h-64 overflow-y-auto p-1"
        >
          <CityOption
            label="All cities"
            selected={value === null}
            onSelect={() => select(null)}
          />
          {matches.map((city) => (
            <CityOption
              key={city}
              label={city}
              selected={value === city}
              onSelect={() => select(city)}
            />
          ))}
          {matches.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No cities found
            </p>
          )}
          {!query && cities.length > MAX_RESULTS && (
            <p className="px-2 py-1.5 text-center text-xs text-muted-foreground">
              Showing first {MAX_RESULTS} — type to search all{" "}
              {cities.length.toLocaleString("en-US")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CityOption({
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
