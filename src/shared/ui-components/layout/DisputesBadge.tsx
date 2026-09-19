"use client";

import { useAuth } from "@/features/auth";
import { useDisputeAttentionCount } from "@/features/disputes";

import { CountBadge } from "./CountBadge";

/**
 * Count pill on the Disputes nav item, for either party. Reads the caller's
 * role itself rather than taking one, the same shape as `InboxBadge` — the nav
 * render sites have no user in scope.
 *
 * Counts disputes still undecided, not unread admin replies: a dispute is
 * pending from the moment it is opened, and an admin who has not written back
 * yet is exactly the case the badge exists to surface.
 */
export function DisputesBadge() {
  const { user } = useAuth();
  const isParticipant = user?.role === "company" || user?.role === "recruiter";
  const { data } = useDisputeAttentionCount(isParticipant);
  if (!isParticipant) return null;
  return <CountBadge count={data} />;
}
