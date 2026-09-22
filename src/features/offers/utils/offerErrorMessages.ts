import { HttpStatusCode } from "axios";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";

/**
 * Withdrawing is the one offer action whose 403 is not "you cannot respond to
 * your own offer" — it is the opposite, only the creator may do it — so it
 * gets its own copy rather than reusing `OfferCard`'s combined message for
 * accept/decline/counter/withdraw.
 *
 * 409 stays reachable even where the button is gated on `status === "sent"`:
 * that gate reads a snapshot the counterparty can invalidate between render
 * and click.
 */
export function withdrawOfferErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not withdraw this offer. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Forbidden:
      return "Only whoever sent this offer can withdraw it.";
    case HttpStatusCode.NotFound:
      return "This offer is no longer available — refresh and try again.";
    case HttpStatusCode.Conflict:
      return "This offer is no longer awaiting a response.";
    default:
      return allMessages(error);
  }
}
