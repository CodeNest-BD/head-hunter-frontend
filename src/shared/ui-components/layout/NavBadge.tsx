"use client";

import type { NavItem } from "./dashboardNav";
import { DisputesBadge } from "./DisputesBadge";
import { InboxBadge } from "./InboxBadge";
import { SubmissionsBadge } from "./SubmissionsBadge";

/**
 * The count pill a nav item asks for. One component rather than a conditional
 * per badge at each of the three render sites (sidebar expanded, sidebar
 * collapsed, user menu) — adding a badge should touch the nav definition, not
 * every place that draws it.
 */
export function NavBadge({ badge }: { badge: NavItem["badge"] }) {
  if (badge === "inbox") return <InboxBadge />;
  if (badge === "disputes") return <DisputesBadge />;
  if (badge === "submissions") return <SubmissionsBadge />;
  return null;
}
