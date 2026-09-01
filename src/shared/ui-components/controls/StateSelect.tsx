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
      // Inside a form, Radix mirrors the value into a hidden native <select>
      // and echoes a change event back. Until its options have registered that
      // echo reports "", which would wipe a value set programmatically (the
      // job form seeding the company's state). No option here is empty, so a
      // real choice never is either — the echo is the only source of "".
      onValueChange={(next) => {
        if (next !== "") onChange(next);
      }}
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
