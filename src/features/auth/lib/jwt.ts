import { z } from "zod";

/**
 * Decode a JWT payload WITHOUT verifying the signature. Returns the raw parsed
 * payload as `unknown` — callers validate the shape they need with zod. The
 * caller must have received the token from a trusted source (our backend); we
 * read it only to schedule a proactive refresh ahead of `exp`.
 */
export function decodeJwtPayload(token: string): unknown {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    if (typeof atob !== "function") return null;
    const parsed: unknown = JSON.parse(atob(padded));
    return parsed;
  } catch {
    return null;
  }
}

const ExpiryClaimSchema = z.object({ exp: z.number() });

/** Access-token expiry in epoch milliseconds, or null if unreadable. */
export function expiryMillisFromToken(token: string): number | null {
  const result = ExpiryClaimSchema.safeParse(decodeJwtPayload(token));
  return result.success ? result.data.exp * 1000 : null;
}
