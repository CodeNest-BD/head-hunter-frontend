import {
  BadgeCheck,
  Briefcase,
  Building2,
  Gavel,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Map,
  MessagesSquare,
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

/**
 * A titled run of nav items.
 *
 * The redesign groups the rail rather than listing it flat — Overview,
 * Marketplace, Operations, Finance, System — so a reader finds a destination
 * by the kind of work it belongs to instead of scanning eleven labels. The
 * same five headings serve every role; only the items under them differ.
 */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Role-based primary navigation, shared by the sidebar and the user menu. */
export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  company: [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Marketplace",
      items: [
        { href: "/company/jobs", label: "Jobs", icon: Briefcase },
        { href: "/company/inbox", label: "Inbox", icon: Inbox, badge: "inbox" },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          href: "/disputes",
          label: "Disputes",
          icon: Scale,
          badge: "disputes",
        },
      ],
    },
    {
      label: "Finance",
      items: [{ href: "/company/wallet", label: "Wallet", icon: Wallet2 }],
    },
    {
      label: "Account",
      items: [
        { href: "/company/profile", label: "My Profile", icon: UserRound },
      ],
    },
  ],
  recruiter: [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        // The job map is a primary recruiter surface, so it sits in the rail
        // alongside the dashboard. Notifications stay in the bell dropdown.
        { href: "/explore-jobs", label: "Live Map", icon: Map },
      ],
    },
    {
      label: "Marketplace",
      items: [
        {
          href: "/recruiter/inbox",
          label: "Inbox",
          icon: Send,
          badge: "inbox",
        },
        { href: "/recruiter/submissions", label: "Submissions", icon: Users },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          href: "/disputes",
          label: "Disputes",
          icon: Scale,
          badge: "disputes",
        },
      ],
    },
    {
      label: "Finance",
      items: [
        { href: "/recruiter/wallet", label: "Wallet", icon: Wallet2 },
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
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/recruiter/profile", label: "My Profile", icon: UserRound },
      ],
    },
  ],
  admin: [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Marketplace",
      items: [
        { href: "/admin/recruiters", label: "Recruiters", icon: Users },
        { href: "/admin/companies", label: "Companies", icon: Building2 },
        { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
      ],
    },
    {
      // The design names it "Dispute Center" and gives Conversations its own
      // row rather than reaching them through a job's candidate count.
      label: "Operations",
      items: [
        {
          href: "/admin/disputes",
          label: "Dispute Center",
          icon: Gavel,
          badge: "disputes",
        },
        {
          href: "/admin/conversations",
          label: "Conversations",
          icon: MessagesSquare,
        },
      ],
    },
    {
      label: "System",
      items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
    },
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
export function navGroupsForRole(
  role: Role,
  isApproved: boolean,
): readonly NavGroup[] {
  const hidden = HIDE_PHASE2_FEATURES ? HIDDEN_PHASE2_LABELS[role] : [];
  const allowed =
    role === "admin" || isApproved ? null : UNAPPROVED_LABELS[role];

  // One pass per group, then drop the groups left with nothing — a heading
  // over an empty run reads as a section that failed to load.
  return NAV_BY_ROLE[role].flatMap((group) => {
    const items = group.items.filter(
      (item) =>
        !hidden.includes(item.label) &&
        (allowed === null || allowed.includes(item.label)),
    );
    return items.length > 0 ? [{ ...group, items }] : [];
  });
}

/**
 * The same navigation as one flat run, for the places that cannot show
 * headings — the top-bar user menu. Derived from the groups rather than kept
 * beside them, so a destination can never appear in one and not the other.
 */
export function navForRole(
  role: Role,
  isApproved: boolean,
): readonly NavItem[] {
  return navGroupsForRole(role, isApproved).flatMap((group) => group.items);
}
