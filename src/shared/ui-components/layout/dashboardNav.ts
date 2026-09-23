import {
  BadgeCheck,
  Briefcase,
  Building2,
  Gavel,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Map,
  Scale,
  Send,
  Settings,
  Users,
  UserRound,
  Wallet2,
} from "lucide-react";

import type { Role } from "@/features/auth";
import {
  HIDE_PHASE2_FEATURES,
  PHASE1_FREE,
} from "@/shared/config/featureFlags";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Which count pill this item carries, if any: waiting candidates on either
   * side's Inbox, or undecided disputes on Disputes. */
  badge?: "inbox" | "disputes";
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
      badge: "inbox",
    },
    { href: "/company/wallet", label: "Wallet", icon: Wallet2 },
    { href: "/disputes", label: "Disputes", icon: Scale, badge: "disputes" },
    { href: "/company/profile", label: "My Profile", icon: UserRound },
  ],
  recruiter: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    // The job map is a primary recruiter surface, so it sits in the sidebar
    // nav alongside the dashboard. Notifications stay in the bell dropdown.
    { href: "/explore-jobs", label: "Live Map", icon: Map },
    {
      href: "/recruiter/inbox",
      label: "Inbox",
      icon: Send,
      badge: "inbox",
    },
    { href: "/recruiter/submissions", label: "Submissions", icon: Users },
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
    { href: "/disputes", label: "Disputes", icon: Scale, badge: "disputes" },
    { href: "/recruiter/profile", label: "My Profile", icon: UserRound },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/recruiters", label: "Recruiters", icon: Users },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
    // Conversations are consolidated under Jobs: a job's candidate count
    // links into the conversations view, so no separate nav item.
    {
      href: "/admin/disputes",
      label: "Disputes",
      icon: Gavel,
      badge: "disputes",
    },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

/**
 * Nav labels an unapproved account still sees.
 *
 * Either role keeps only its profile — the page it completes to get approved.
 * The dashboard goes too: every tile on it reads an endpoint the approval gate
 * refuses, so it can only ever render the pending banner, which the profile
 * page already carries. Notifications stay reachable from the top-bar bell
 * rather than the sidebar.
 */
const UNAPPROVED_LABELS: Record<Role, readonly string[]> = {
  // The map stays reachable while unapproved — it renders its own locked
  // teaser, nudging the recruiter to finish verification.
  recruiter: ["Live Map", "My Profile"],
  company: ["My Profile"],
  admin: [],
};

/**
 * Nav items hidden for the phase-1 client delivery (see HIDE_PHASE2_FEATURES).
 * Removing them here covers both the sidebar and the top dropdown at once.
 */
const HIDDEN_PHASE2_LABELS: Record<Role, readonly string[]> = {
  recruiter: ["Inbox", "Wallet"],
  company: ["Inbox"],
  admin: [],
};

/**
 * Approval-aware nav selector. `UserMenu` and `SidebarContent` both read
 * through this instead of `NAV_BY_ROLE` directly, so reducing an unapproved
 * account's navigation — and hiding phase-2 items — fixes the dropdown and the
 * sidebar in one change. Admins are never reduced by approval.
 */
export function navForRole(
  role: Role,
  isApproved: boolean,
): readonly NavItem[] {
  let items: readonly NavItem[] = NAV_BY_ROLE[role];
  if (HIDE_PHASE2_FEATURES) {
    const hidden = HIDDEN_PHASE2_LABELS[role];
    if (hidden.length > 0) {
      items = items.filter((item) => !hidden.includes(item.label));
    }
  }
  if (role === "admin" || isApproved) {
    return items;
  }
  const allowed = UNAPPROVED_LABELS[role];
  return items.filter((item) => allowed.includes(item.label));
}
