import { z } from "zod";

/**
 * Account roles a user can hold. `admin` is provisioned out of band and cannot
 * be self-assigned at sign-up, but it MUST be parseable here — omitting it made
 * an admin login fail authUserSchema.parse and break session boot entirely.
 */
export const roleSchema = z.enum(["company", "recruiter", "admin"]);
export type Role = z.infer<typeof roleSchema>;

/**
 * The subset a user may choose at sign-up. Kept separate from `roleSchema`
 * deliberately: the backend rejects a self-assigned admin (SELF_SIGNUP_ROLES),
 * so the form must never offer it even though the session parser accepts it.
 */
export const signupRoleSchema = z.enum(["company", "recruiter"]);
export type SignupRole = z.infer<typeof signupRoleSchema>;

/**
 * User profile as returned by GET /auth/me. `profile` is backend-shaped and
 * role-dependent, so it's kept as an opaque record the UI renders defensively
 * rather than over-specified here.
 */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
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
