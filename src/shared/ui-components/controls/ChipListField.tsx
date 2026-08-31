"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "./button";
import { Input } from "./input";

/** Case- and whitespace-insensitive identity, so "AWS" and " aws " are one
 * entry rather than two chips that look the same to a reader. */
const matchKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export interface ChipListRejection {
  reason: "empty" | "duplicate" | "tooLong" | "full";
  message: string;
}

interface AddResult {
  next: string[];
  rejection?: ChipListRejection;
}

/**
 * The pure half of the field: what adding `draft` to `value` should produce.
 * Exported so its rules can be tested without a DOM.
 */
export function addChip(
  value: string[],
  draft: string,
  limits: { max: number; maxLength: number },
): AddResult {
  const entry = draft.trim().replace(/\s+/g, " ");
  if (entry === "") {
    return { next: value, rejection: { reason: "empty", message: "" } };
  }
  if (entry.length > limits.maxLength) {
    return {
      next: value,
      rejection: {
        reason: "tooLong",
        message: `Keep it under ${limits.maxLength} characters`,
      },
    };
  }
  if (value.length >= limits.max) {
    return {
      next: value,
      rejection: {
        reason: "full",
        message: `Up to ${limits.max} entries`,
      },
    };
  }
  if (value.some((existing) => matchKey(existing) === matchKey(entry))) {
    return {
      next: value,
      rejection: { reason: "duplicate", message: "Already added" },
    };
  }
  return { next: [...value, entry] };
}

interface ChipListFieldProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Wording for the add input, e.g. "Add a must-have". */
  placeholder: string;
  /** Labels the input for assistive tech, since the visible label is the
   * section heading rather than a <label> for this control. */
  ariaLabel: string;
  max: number;
  maxLength: number;
  id?: string;
}

/**
 * A free-text tag list: type, press Enter, get a removable chip. Deliberately
 * simpler than the specializations field, which is welded to a curated
 * suggestion list — this one has no vocabulary of its own.
 */
export function ChipListField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  max,
  maxLength,
  id,
}: ChipListFieldProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const commit = (): void => {
    const { next, rejection } = addChip(value, draft, { max, maxLength });
    if (rejection) {
      setError(rejection.message === "" ? null : rejection.message);
      return;
    }
    onChange(next);
    setDraft("");
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((entry, index) => (
            <li key={entry}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-medium text-primary">
                {entry}
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((_, position) => position !== index))
                  }
                  aria-label={`Remove ${entry}`}
                  className="rounded-full p-0.5 text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {value.length < max && (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="text"
            value={draft}
            aria-label={ariaLabel}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                // Enter in a chip field adds a chip; without this it submits
                // the whole job form instead.
                event.preventDefault();
                commit();
              }
            }}
            placeholder={placeholder}
            className={cn("h-11", error !== null && "border-destructive")}
          />
          <Button type="button" variant="outline" size="sm" onClick={commit}>
            Add
          </Button>
        </div>
      )}
      {error !== null && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
