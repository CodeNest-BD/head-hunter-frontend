import { z } from "zod";

/**
 * A `z.enum` that degrades an unfamiliar value to `fallback` instead of
 * failing the whole parse. `fallback` must itself be one of `values`.
 *
 * Tolerance is a per-field decision, not a default: reach for this on a
 * vocabulary the backend is expected to grow over time (an event type, a
 * submission status) where a thread that renders an unfamiliar entry plainly
 * is better than one that throws. Do NOT reach for it on a field like a role,
 * where an unrecognised value means something is wrong and must fail loudly
 * rather than be silently reinterpreted as a fallback the caller never meant.
 */
export function tolerantEnum<Values extends readonly [string, ...string[]]>(
  values: Values,
  fallback: Values[number],
) {
  return z.enum(values).catch(fallback);
}
