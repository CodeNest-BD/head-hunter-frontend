"use client";

import { useState } from "react";
import {
  MAX_SPECIALIZATIONS,
  MAX_SPECIALIZATION_LENGTH,
  SPECIALIZATION_SUGGESTIONS,
  findSuggestionValue,
  normalizeSpecialization,
  specializationMatchKey,
} from "@/shared/utils/specializations";

const SUGGESTION_VALUE_SET = new Set<string>(
  SPECIALIZATION_SUGGESTIONS.map((suggestion) => suggestion.value),
);

export interface SpecializationChip {
  /** What gets stored/submitted: a curated slug, or the custom text verbatim. */
  value: string;
  /** What the chip displays. */
  label: string;
}

interface UseSpecializationsFieldArgs {
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * Shared selection/add-custom logic behind the specializations chip picker on
 * the sign-up form and the recruiter profile form. Both forms render their
 * own chip markup (to keep each form's exact existing styling) but drive it
 * through this hook so the toggle, limit, and dedupe rules can't drift
 * between the two. Curated chips are stored as their slug; a committed custom
 * chip is stored exactly as typed.
 */
export function useSpecializationsField({
  value,
  onChange,
}: UseSpecializationsFieldArgs) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const customChips: SpecializationChip[] = value
    .filter((entry) => !SUGGESTION_VALUE_SET.has(entry))
    .map((entry) => ({ value: entry, label: entry }));
  const chips: SpecializationChip[] = [
    ...SPECIALIZATION_SUGGESTIONS,
    ...customChips,
  ];
  const atLimit = value.length >= MAX_SPECIALIZATIONS;

  function toggle(chipValue: string): void {
    if (value.includes(chipValue)) {
      onChange(value.filter((entry) => entry !== chipValue));
      return;
    }
    if (atLimit) {
      setError(`You can add up to ${MAX_SPECIALIZATIONS} specializations`);
      return;
    }
    setError(undefined);
    onChange([...value, chipValue]);
  }

  function openAdd(): void {
    setError(undefined);
    setDraft("");
    setIsAdding(true);
  }

  function cancelAdd(): void {
    setIsAdding(false);
    setDraft("");
    setError(undefined);
  }

  function finishAdd(): void {
    setDraft("");
    setError(undefined);
    setIsAdding(false);
  }

  /** Commits the draft as a chip: selects the matching curated or
   * already-added custom chip instead of adding a duplicate. */
  function commitAdd(): void {
    const normalized = normalizeSpecialization(draft);
    if (normalized === "") {
      cancelAdd();
      return;
    }
    if (normalized.length > MAX_SPECIALIZATION_LENGTH) {
      setError(`Keep it under ${MAX_SPECIALIZATION_LENGTH} characters`);
      return;
    }

    const suggestionValue = findSuggestionValue(normalized);
    if (suggestionValue) {
      if (!value.includes(suggestionValue)) {
        onChange([...value, suggestionValue]);
      }
      finishAdd();
      return;
    }

    const normalizedKey = specializationMatchKey(normalized);
    const existingCustom = value.find(
      (entry) =>
        !SUGGESTION_VALUE_SET.has(entry) &&
        specializationMatchKey(entry) === normalizedKey,
    );
    if (existingCustom) {
      finishAdd();
      return;
    }

    if (atLimit) {
      setError(`You can add up to ${MAX_SPECIALIZATIONS} specializations`);
      return;
    }

    onChange([...value, normalized]);
    finishAdd();
  }

  return {
    chips,
    isAdding,
    draft,
    setDraft,
    error,
    atLimit,
    toggle,
    openAdd,
    cancelAdd,
    commitAdd,
  };
}
