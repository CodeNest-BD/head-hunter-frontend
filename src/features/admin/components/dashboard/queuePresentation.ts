import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  MessageSquare,
  PauseCircle,
  Scale,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import type { PillTone } from "@/shared/ui-components/badges/Pill";
import type { DashboardQueue, DashboardQueueKey } from "../../schemas";

/**
 * How each work queue reads.
 *
 * The server sends a stable key, the count and the facts behind it; the label,
 * the icon, the tone and where Review goes are the client's. Wording and
 * routing change far more often than the counting does, so keeping them apart
 * makes a copy change a one-line edit here rather than a deploy on both sides.
 */
export interface QueuePresentation {
  label: string;
  icon: LucideIcon;
  /** Drives both the priority chip and the icon's tinted square. */
  tone: PillTone;
  priorityLabel: string;
  href: string;
}

export const QUEUE_PRESENTATION: Record<DashboardQueueKey, QueuePresentation> =
  {
    disputes_near_payout: {
      label: "Disputes near payout date",
      icon: Scale,
      tone: "warn",
      priorityLabel: "Urgent",
      href: "/admin/disputes",
    },
    disputes_awaiting_reply: {
      label: "Disputes awaiting your reply",
      icon: MessageSquare,
      tone: "warn",
      priorityLabel: "Urgent",
      href: "/admin/disputes",
    },
    failed_payouts: {
      label: "Failed payout",
      icon: AlertTriangle,
      tone: "bad",
      priorityLabel: "Failed",
      href: "/admin/disputes",
    },
    payments_on_hold: {
      label: "Payments on hold",
      icon: PauseCircle,
      tone: "warn",
      priorityLabel: "On hold",
      href: "/admin/disputes",
    },
    recruiter_verifications: {
      label: "Recruiter verifications",
      icon: UserCheck,
      tone: "info",
      priorityLabel: "To review",
      href: "/admin/recruiters",
    },
    company_approvals: {
      label: "Company approvals",
      icon: Building2,
      tone: "info",
      priorityLabel: "To review",
      href: "/admin/companies",
    },
    submissions_awaiting_review: {
      label: "Submissions awaiting review",
      icon: ClipboardCheck,
      // Amber and "Urgent", matching the flag the server now sets: the row was
      // already counted under the Urgent filter while wearing a blue "To
      // review" chip, which read as a contradiction.
      tone: "warn",
      priorityLabel: "Urgent",
      // Straight to the queue, already filtered: the point of the row is the
      // work, and an admin landing on every submission ever made would have
      // to re-find the ones that need them.
      href: "/admin/submissions?status=pending_review",
    },
  };

/**
 * How far up the list each priority belongs.
 *
 * The server returns its queues in a fixed declaration order, which put a
 * newly added queue last whatever it was worth — the submissions queue sat
 * under two "To review" rows while wearing an Urgent chip and being counted
 * in the Urgent filter. A panel called "Needs your attention" has to lead with
 * what needs it most.
 */
const PRIORITY_RANK: Record<DashboardQueue["priority"], number> = {
  urgent: 0,
  failed: 1,
  on_hold: 2,
  to_review: 3,
};

/**
 * Most pressing first, and stable within a priority so queues of equal weight
 * keep the server's order rather than shuffling between renders.
 *
 * Returns a new array: the queues come straight from the query cache, and
 * sorting in place would reorder what every other reader of that cache sees.
 */
export function byPriority(
  queues: readonly DashboardQueue[],
): DashboardQueue[] {
  return [...queues].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}
