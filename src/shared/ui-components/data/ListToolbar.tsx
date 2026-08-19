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
 */
export function ListToolbar({
  query,
  onQueryChange,
  placeholder,
  filter,
  extraFilter,
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
      {filter && <FilterSelect config={filter} />}
      {extraFilter && <FilterSelect config={extraFilter} />}
    </div>
  );
}

function FilterSelect({ config }: { config: FilterConfig }) {
  return (
    <Select
      value={config.value === "" ? ALL : config.value}
      onValueChange={(next) => config.onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter">
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
