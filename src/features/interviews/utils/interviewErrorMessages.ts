import { HttpStatusCode } from "axios";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";

/**
 * The copy for every company-side scheduling write, kept in one module because
 * the same failures are reachable from more than one entry point: a candidate
 * card and a thread's proposal card both propose times and both withdraw, and
 * their wording must not drift apart.
 */

/**
 * 409 stays reachable even though the UI now resumes an open interview instead
 * of offering to create a second one — the check reads a snapshot that another
 * tab can invalidate between render and click.
 */
export function createInterviewErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not start scheduling. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Conflict:
      return "This candidate already has an interview awaiting a time or scheduled.";
    default:
      return allMessages(error);
  }
}

/**
 * 403 (a recruiter calling this company-only endpoint) and 409 (the interview
 * is no longer awaiting a time) are both reachable in normal use, so each gets
 * a specific message — the same rationale as `MessageComposer`'s send errors.
 */
export function proposeSlotsErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not propose these times. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Forbidden:
      return "Only the company can propose interview times.";
    case HttpStatusCode.Conflict:
      return "This interview is no longer awaiting a time.";
    default:
      return allMessages(error);
  }
}

/**
 * 409 (the interview already moved past "awaiting a time" — a slot was just
 * confirmed, or it was already canceled) is reachable even where the button is
 * gated on `status === "proposed"`, because that gate is read from a snapshot
 * that can be stale by the time the request lands.
 */
export function withdrawInterviewErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Something went wrong. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Conflict:
      return "This interview can no longer be withdrawn — it may already be scheduled or canceled.";
    case HttpStatusCode.NotFound:
      return "This interview is no longer available — refresh and try again.";
    default:
      return allMessages(error);
  }
}
