import {
  AlertTriangle,
  Building2,
  MessageSquare,
  PauseCircle,
  Scale,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import type { PillTone } from "@/shared/ui-components/badges/Pill";
import type { DashboardQueueKey } from "../../schemas";

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
  };
