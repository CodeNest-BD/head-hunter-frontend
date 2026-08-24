"use client";

import { useAuth } from "@/features/auth";
import { useInboxAttentionCount, type InboxSide } from "@/features/inbox";

import { CountBadge } from "./CountBadge";

/**
 * Count pill on either side's Inbox nav item, in the sidebar and the user menu
 * alike. It reads the caller's role itself rather than taking a side, so the
 * nav render sites — one of which has no user in scope — stay unchanged.
 *
 * Counts candidates waiting, not unread messages: a candidate submitted with
 * no pitch produces no message, so the message count left a brand-new
 * submission invisible in the nav.
 */
export function InboxBadge() {
  const { user } = useAuth();
  const side: InboxSide | null =
    user?.role === "company" || user?.role === "recruiter" ? user.role : null;
  if (!side) return null;
  return <InboxCount side={side} />;
}

/** Split out so the query is never mounted for a role that has no inbox. */
function InboxCount({ side }: { side: InboxSide }) {
  const { data } = useInboxAttentionCount(side);
  return <CountBadge count={data} />;
}
