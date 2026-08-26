"use client";

import { US_STATES } from "@/shared/data/usStatesGeo";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface StateSelectProps {
  /** Two-letter US state code, or "" for none. */
  value: string;
  onChange: (code: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * The single US-state picker used everywhere a state is entered (job posting,
 * company and recruiter profiles, sign-up). A plain dropdown over the canonical
 * `US_STATES` list, so every form stores the same two-letter codes and no form
 * accepts a typo'd state.
 */
export function StateSelect({
  value,
  onChange,
  id,
  className,
  placeholder = "Select a state",
  disabled,
}: StateSelectProps) {
  return (
    <Select
      value={value === "" ? undefined : value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {US_STATES.map((state) => (
          <SelectItem key={state.code} value={state.code}>
            {state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
