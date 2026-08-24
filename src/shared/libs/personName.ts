import { z } from "zod";

/**
 * A person's name, as sign-up and every later edit of it accept it. Mirrors the
 * backend's PERSON_NAME_PATTERN, so a name the API would reject is caught
 * before the round-trip.
 *
 * `label` names the field in the required-message ("First name is required").
 */
export const personNameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(80, "Keep it under 80 characters")
    .regex(
      /^[\p{L}\p{M}][\p{L}\p{M}'\-. ]*$/u,
      "Use letters, spaces, hyphens, apostrophes and periods only",
    );
