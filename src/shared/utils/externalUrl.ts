/**
 * A user-supplied address as a safe `href`, or null when it cannot be one.
 *
 * Two hazards on every link the app renders from something a user typed —
 * a company's website, a recruiter's or candidate's LinkedIn:
 *
 * - **No scheme.** `acme.com` in an `href` is a *relative* path, so clicking
 *   it navigates inside our own app rather than out to the company. Rows
 *   saved before the profile forms required a full URL still look like this.
 * - **A dangerous scheme.** Zod's `.url()` is `new URL()` underneath, which
 *   happily accepts `javascript:alert(1)`. That reaches an `href` as a live
 *   script, and the one place it would be clicked is an admin reviewing an
 *   account they do not trust yet.
 *
 * So: assume `https` when no scheme was given, then allow only http(s).
 * Anything else returns null and the caller shows the raw text instead of a
 * link — visible, but inert.
 */
export function safeExternalHref(
  raw: string | null | undefined,
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  // A scheme is `letter *( letter / digit / "+" / "-" / "." ) ":"` (RFC 3986).
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** The same address as a reader should see it — no scheme, no trailing slash. */
export function displayUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}
