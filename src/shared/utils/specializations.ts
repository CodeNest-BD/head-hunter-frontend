import { z } from "zod";

/**
 * Curated specializations shown as chips on the sign-up form and the
 * recruiter profile form. The single source for what is offered — the backend
 * stores `specializations` as free text and keeps no copy of this list. Unrelated
 * to a job's `ROLE_CATEGORIES`, which is a fixed backend enum describing the
 * role rather than the recruiter. `value` is the slug stored in the backend's
 * `specializations` `text[]` column and sent over the wire; `label` is what
 * the chip displays. A recruiter can also add a specialization that isn't
 * listed here via the "+ Add" chip — that custom entry is stored verbatim
 * (no slugging), so the column holds a mix of curated slugs and free text.
 */
export interface SpecializationSuggestion {
  readonly value: string;
  readonly label: string;
}

export const SPECIALIZATION_SUGGESTIONS: readonly SpecializationSuggestion[] = [
  { value: "accounting", label: "Accounting" },
  { value: "finance", label: "Finance" },
  { value: "human_resources", label: "Human Resources" },
  { value: "administrative", label: "Administrative" },
  { value: "customer_service", label: "Customer Service" },
  { value: "technology", label: "Technology" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "healthcare", label: "Healthcare" },
  { value: "pharma", label: "Pharma" },
  { value: "biotech", label: "Biotech" },
  { value: "skilled_trades", label: "Skilled Trades" },
  { value: "logistics_supply_chain", label: "Logistics & Supply Chain" },
  { value: "hospitality", label: "Hospitality" },
] as const;

const LABEL_BY_VALUE = new Map<string, string>(
  SPECIALIZATION_SUGGESTIONS.map((s) => [s.value, s.label]),
);

/**
 * Renders a stored specialization for display: a recognized curated slug
 * (e.g. `human_resources`) renders as its label ("Human Resources"); anything
 * else — a custom entry, or a slug from before the suggestion list changed —
 * passes through unchanged rather than being mangled.
 */
export function getSpecializationLabel(value: string): string {
  return LABEL_BY_VALUE.get(value) ?? value;
}

/** Collapses case and separator differences so a curated slug and its typed
 * label compare equal — `human_resources` and "Human Resources" both key to
 * "human resources", as do `skilled_trades` and "Skilled-Trades". Exported so
 * callers
 * (e.g. the custom-entry dedupe in `useSpecializationsField`) can compare two
 * arbitrary specializations the same way this module compares against the
 * curated suggestions. */
export function specializationMatchKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SUGGESTION_VALUE_BY_MATCH_KEY = new Map<string, string>();
for (const suggestion of SPECIALIZATION_SUGGESTIONS) {
  SUGGESTION_VALUE_BY_MATCH_KEY.set(
    specializationMatchKey(suggestion.value),
    suggestion.value,
  );
  SUGGESTION_VALUE_BY_MATCH_KEY.set(
    specializationMatchKey(suggestion.label),
    suggestion.value,
  );
}

/** Slug of the curated suggestion matching `value` (by slug or label,
 * case/separator-insensitively), or undefined if it isn't one of them. */
export function findSuggestionValue(value: string): string | undefined {
  return SUGGESTION_VALUE_BY_MATCH_KEY.get(specializationMatchKey(value));
}

export const MAX_SPECIALIZATION_LENGTH = 60;
export const MAX_SPECIALIZATIONS = 15;

/** Trims and collapses internal whitespace; preserves case and punctuation so
 * a custom entry is stored exactly as typed. */
export function normalizeSpecialization(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Validates a recruiter's chosen specializations client-side, mirroring the
 * backend's rules: each entry non-empty and at most 60 characters, at most 15
 * entries total, no duplicates once separators and case are normalized away.
 * `useSpecializationsField` keeps the UI from ever producing a duplicate or an
 * over-limit array, but the schema still guards form state assembled any
 * other way (e.g. defaults).
 */
export const specializationsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Specialization can't be empty")
      .max(
        MAX_SPECIALIZATION_LENGTH,
        `Keep each specialization under ${MAX_SPECIALIZATION_LENGTH} characters`,
      ),
  )
  .max(
    MAX_SPECIALIZATIONS,
    `Choose up to ${MAX_SPECIALIZATIONS} specializations`,
  )
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      const key = specializationMatchKey(value);
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Duplicate specialization",
        });
        return;
      }
      seen.add(key);
    });
  });
