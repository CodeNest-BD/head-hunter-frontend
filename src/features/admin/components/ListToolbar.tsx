"use client";

import { Search } from "lucide-react";

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

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  filter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    allLabel: string;
  };
}

// Radix Select forbids an empty-string item value, so "all" is the sentinel for
// "no filter" and maps to/from the empty string the query state uses.
const ALL = "all";

/** Search box + optional status filter (dropdown) for the admin tables. */
export function ListToolbar({
  query,
  onQueryChange,
  placeholder,
  filter,
}: ListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
      {filter && (
        <Select
          value={filter.value === "" ? ALL : filter.value}
          onValueChange={(next) => filter.onChange(next === ALL ? "" : next)}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter">
            <SelectValue placeholder={filter.allLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{filter.allLabel}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
