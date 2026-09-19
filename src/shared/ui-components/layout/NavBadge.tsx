"use client";

import type { NavItem } from "./dashboardNav";
import { DisputesBadge } from "./DisputesBadge";
import { InboxBadge } from "./InboxBadge";

/**
 * The count pill a nav item asks for. One component rather than a conditional
 * per badge at each of the three render sites (sidebar expanded, sidebar
 * collapsed, user menu) — adding a badge should touch the nav definition, not
 * every place that draws it.
 */
export function NavBadge({ badge }: { badge: NavItem["badge"] }) {
  if (badge === "inbox") return <InboxBadge />;
  if (badge === "disputes") return <DisputesBadge />;
  return null;
}
