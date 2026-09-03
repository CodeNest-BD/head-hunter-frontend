"use client";

import { useMemo } from "react";

import { US_STATES } from "@/shared/data/usStatesGeo";

import { SearchableSelect } from "./SearchableSelect";

interface StateSelectProps {
  /** Two-letter US state code, or "" for none. */
  value: string;
  onChange: (code: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * When set, adds a top option (e.g. "All states") that clears the selection —
   * used by the explore filters. Omit it in forms, where a state is required.
   */
  clearLabel?: string;
}

// Alphabetical by name (incl. DC), computed once — the canonical order every
// state picker shows.
const STATE_OPTIONS = [...US_STATES]
  .map((state) => ({ value: state.code, label: state.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * The single US-state picker used everywhere a state is entered (job posting,
 * company and recruiter profiles, sign-up) or filtered (explore). A searchable
 * combobox over the canonical `US_STATES` list, so every form stores the same
 * two-letter codes, no form accepts a typo'd state, and finding a state is a
 * quick type rather than a 50-item scroll.
 */
export function StateSelect({
  value,
  onChange,
  id,
  className,
  placeholder = "Select a state",
  disabled,
  clearLabel,
}: StateSelectProps) {
  // The base speaks `string | null`; this picker's "none" is "". Memoized so the
  // options identity is stable across renders.
  const options = useMemo(() => STATE_OPTIONS, []);

  return (
    <SearchableSelect
      id={id}
      className={className}
      options={options}
      value={value === "" ? null : value}
      onChange={(next) => onChange(next ?? "")}
      placeholder={placeholder}
      searchPlaceholder="Search states…"
      clearLabel={clearLabel}
      emptyMessage="No states found"
      disabled={disabled}
    />
  );
}
