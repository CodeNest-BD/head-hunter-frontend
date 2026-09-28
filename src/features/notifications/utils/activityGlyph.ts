import {
  Award,
  Bell,
  Briefcase,
  CalendarCheck,
  DollarSign,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { TileTone } from "@/shared/ui-components/list/Tile";

/**
 * The glyph and semantic tone a notification wears in an activity feed.
 *
 * Notification types are open-ended strings from the backend, so this matches on
 * substrings rather than a closed union — an unrecognised type still gets a
 * sensible bell rather than an empty tile. Both dashboards read from here, so a
 * "payout released" event looks the same to a company and to a recruiter.
 */
export function activityGlyph(type: string): {
  icon: LucideIcon;
  tone: TileTone;
} {
  const t = type.toLowerCase();
  if (t.includes("offer") || t.includes("hire") || t.includes("placement")) {
    return { icon: Award, tone: "violet" };
  }
  if (t.includes("interview")) return { icon: CalendarCheck, tone: "ok" };
  if (t.includes("wallet") || t.includes("payout") || t.includes("payment")) {
    return { icon: DollarSign, tone: "ok" };
  }
  if (t.includes("message") || t.includes("chat")) {
    return { icon: MessageSquare, tone: "blue" };
  }
  if (t.includes("candidate") || t.includes("submission")) {
    return { icon: UserPlus, tone: "blue" };
  }
  if (t.includes("job")) return { icon: Briefcase, tone: "neutral" };
  return { icon: Bell, tone: "neutral" };
}
