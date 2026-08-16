import {
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Map,
  MessagesSquare,
  Send,
  Settings,
  Users,
  UserRound,
  Wallet2,
} from "lucide-react";

import type { Role } from "@/features/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show the unread-notifications, or unread-messages, badge on this item. */
  badge?: "notifications" | "messages";
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
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: "notifications",
    },
    { href: "/company/wallet", label: "Wallet", icon: Wallet2 },
    { href: "/company/profile", label: "Company profile", icon: Building2 },
  ],
  recruiter: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/explore-jobs", label: "Explore jobs", icon: Map },
    { href: "/companies", label: "Companies", icon: Building2 },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: "notifications",
    },
    {
      href: "/recruiter/submissions",
      label: "Submissions",
      icon: Send,
      badge: "messages",
    },
    {
      href: "/recruiter/subscription",
      label: "Subscription",
      icon: BadgeCheck,
    },
    { href: "/recruiter/wallet", label: "Wallet", icon: Wallet2 },
    { href: "/recruiter/profile", label: "My profile", icon: UserRound },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/recruiters", label: "Recruiters", icon: Users },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
    {
      href: "/admin/conversations",
      label: "Conversations",
      icon: MessagesSquare,
    },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};
