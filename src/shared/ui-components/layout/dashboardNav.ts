import {
  BadgeCheck,
  Briefcase,
  Building2,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Send,
  Settings,
  Users,
  UserRound,
  Wallet2,
} from "lucide-react";

import type { Role } from "@/features/auth";
import { PHASE1_FREE } from "@/shared/config/featureFlags";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show the unread-messages badge on this item (Inbox / Submissions). */
  badge?: "messages";
}

/** Role-based primary navigation, shared by the sidebar and the user menu. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  company: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/company/jobs", label: "Jobs", icon: Briefcase },
    {
      href: "/company/inbox",
      label: "Inbox",
      icon: Inbox,
      badge: "messages",
    },
    { href: "/company/wallet", label: "Wallet", icon: Wallet2 },
    { href: "/company/profile", label: "Profile", icon: UserRound },
  ],
  recruiter: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    // "Explore Jobs" (the job map) lives in the global top bar and the mobile
    // drawer's site links; Notifications live in the bell dropdown — so neither
    // is repeated here.
    { href: "/companies", label: "Companies", icon: Building2 },
    {
      href: "/recruiter/submissions",
      label: "Submissions",
      icon: Send,
      badge: "messages",
    },
    // Recruiting is free during phases 1–2; the subscription page returns
    // with the flag flip.
    ...(PHASE1_FREE
      ? []
      : [
          {
            href: "/recruiter/subscription",
            label: "Subscription",
            icon: BadgeCheck,
          },
        ]),
    { href: "/recruiter/wallet", label: "Wallet", icon: Wallet2 },
    { href: "/recruiter/profile", label: "Profile", icon: UserRound },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/recruiters", label: "Recruiters", icon: Users },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
    // Conversations are consolidated under Jobs: a job's submission count
    // links into the conversations view, so no separate nav item.
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

/**
 * Nav labels an unapproved recruiter still sees: the dashboard (which hosts the
 * verification-pending guidance) and their profile (which they complete to get
 * approved). Everything else is gated until an admin approves them.
 */
const UNAPPROVED_RECRUITER_LABELS = ["Dashboard", "Profile"] as const;

/**
 * Approval-aware nav selector. `UserMenu` and `SidebarContent` both read
 * through this instead of `NAV_BY_ROLE` directly, so reducing an unapproved
 * recruiter's navigation fixes the dropdown and the sidebar in one change.
 * Companies and admins are never reduced.
 */
export function navForRole(
  role: Role,
  isApproved: boolean,
): readonly NavItem[] {
  const items = NAV_BY_ROLE[role];
  if (role !== "recruiter" || isApproved) {
    return items;
  }
  return items.filter((item) =>
    (UNAPPROVED_RECRUITER_LABELS as readonly string[]).includes(item.label),
  );
}
