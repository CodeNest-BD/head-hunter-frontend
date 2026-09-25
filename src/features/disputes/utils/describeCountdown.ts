import {
  formatDate,
  formatDateTime,
  formatElapsed,
} from "@/shared/utils/formatDate";

import type { DisputeCountdown } from "../schemas";

/** One sentence on where the dispute left the placement's release countdown. */
export function describeCountdown(countdown: DisputeCountdown): string {
  const paused = formatElapsed(countdown.pausedMs);
  const remaining = formatElapsed(countdown.remainingMs ?? 0);

  switch (countdown.state) {
    case "not_started":
      return `Not started — the candidate joins on ${formatDate(countdown.joiningDate)}, so nothing is paused yet. The full ${remaining} countdown is still ahead.`;
    case "paused":
      return `Paused for ${paused} so far. ${remaining} of the countdown was left when this dispute was raised.`;
    case "ended_before_dispute":
      return `The release countdown had already ended on ${formatDateTime(countdown.releaseAt)} when this dispute was raised, so nothing is paused. Resuming releases the fee at the next hourly run.`;
    case "resumed":
      return countdown.pausedMs > 0
        ? `Paused for ${paused}, then resumed. The fee now releases on ${formatDateTime(countdown.releaseAt)}.`
        : `Resumed with nothing paused. The fee releases on ${formatDateTime(countdown.releaseAt)}.`;
    case "stopped":
      return countdown.pausedMs > 0
        ? `Stopped — this dispute was closed without resuming the countdown, which has been paused for ${paused}. The fee stays held until support settles it by hand.`
        : "Stopped — this dispute was closed without resuming the countdown. The fee stays held until support settles it by hand.";
    case "settled":
      return "Settled when this dispute was resolved — there is no countdown left.";
  }
}
