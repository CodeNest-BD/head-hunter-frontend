"use client";

import { useMemo } from "react";

import { SearchableSelect } from "./SearchableSelect";

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
 * A searchable city picker — a thin wrapper over {@link SearchableSelect} so it
 * shares the exact look and behaviour of the state picker. Per-state lists run
 * into the thousands, so filtering (not scrolling) is the primary way to find a
 * city, and only the first {@link MAX_RESULTS} render until you type.
 */
export function CityCombobox({
  cities,
  value,
  onChange,
  disabled,
  className,
}: CityComboboxProps) {
  const options = useMemo(
    () => cities.map((city) => ({ value: city, label: city })),
    [cities],
  );

  return (
    <SearchableSelect
      className={className}
      options={options}
      value={value}
      onChange={onChange}
      placeholder="All cities"
      searchPlaceholder="Search cities…"
      clearLabel="All cities"
      emptyMessage="No cities found"
      maxResults={MAX_RESULTS}
      disabled={disabled}
      disabledPlaceholder="Select a state first"
    />
  );
}
