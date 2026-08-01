import { z } from "zod";

/** Account roles a user can hold in the marketplace. */
export const roleSchema = z.enum(["company", "recruiter"]);
export type Role = z.infer<typeof roleSchema>;

/**
 * User profile as returned by GET /auth/me. `profile` is backend-shaped and
 * role-dependent, so it's kept as an opaque record the UI renders defensively
 * rather than over-specified here.
 */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: roleSchema,
  emailVerified: z.boolean(),
  profile: z.record(z.unknown()).nullable().catch(null),
});
export type AuthUser = z.infer<typeof authUserSchema>;

/**
 * The auth lifecycle as a single explicit state:
 * - `booting`: the silent /auth/refresh has not resolved yet. A missing token
 *   is expected, not a signed-out state.
 * - `authenticated`: a session exists; `user` and `accessToken` are present.
 * - `unauthenticated`: boot resolved with no session, or the session was
 *   cleared (logout / refresh 401).
 */
export type AuthStatus = "booting" | "authenticated" | "unauthenticated";
