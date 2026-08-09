"use client";

import { Search } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Input } from "@/shared/ui-components/controls/input";

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

/** Search box + optional status filter shared by the admin directory tables. */
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
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={filter.value === ""}
            label={filter.allLabel}
            onClick={() => filter.onChange("")}
          />
          {filter.options.map((option) => (
            <FilterChip
              key={option.value}
              active={filter.value === option.value}
              label={option.label}
              onClick={() => filter.onChange(option.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-input text-muted-foreground hover:border-primary hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
