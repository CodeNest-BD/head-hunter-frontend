import {
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Map,
  Send,
  UserRound,
  Wallet2,
} from "lucide-react";

import type { Role } from "@/features/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show the unread-notifications badge on this item. */
  badge?: "notifications";
}

/** Role-based primary navigation, shared by the sidebar and the user menu. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  company: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/company/jobs", label: "Jobs", icon: Briefcase },
    { href: "/company/inbox", label: "Inbox", icon: Inbox },
    { href: "/company/wallet", label: "Wallet", icon: Wallet2 },
    { href: "/company/profile", label: "Company profile", icon: Building2 },
  ],
  recruiter: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Job map", icon: Map },
    { href: "/companies", label: "Companies", icon: Building2 },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: "notifications",
    },
    { href: "/recruiter/submissions", label: "Submissions", icon: Send },
    {
      href: "/recruiter/subscription",
      label: "Subscription",
      icon: BadgeCheck,
    },
    { href: "/recruiter/profile", label: "My profile", icon: UserRound },
  ],
  admin: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
};
