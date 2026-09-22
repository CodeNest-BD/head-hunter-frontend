"use client";

import { useAuth } from "@/features/auth";
import {
  useAdminDisputeAttentionCount,
  useDisputeAttentionCount,
} from "@/features/disputes";

import { CountBadge } from "./CountBadge";

/**
 * Count pill on the Disputes nav item, for either party and for the admin.
 * Reads the caller's role itself rather than taking one, the same shape as
 * `InboxBadge` — the nav render sites have no user in scope.
 *
 * Counts disputes still undecided, not unread admin replies: a dispute is
 * pending from the moment it is opened, and an admin who has not written back
 * yet is exactly the case the badge exists to surface. The admin's count is
 * every such dispute, so it reads its own endpoint.
 */
export function DisputesBadge() {
  const { user } = useAuth();
  const isParticipant = user?.role === "company" || user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const participant = useDisputeAttentionCount(isParticipant);
  const admin = useAdminDisputeAttentionCount(isAdmin);
  if (!isParticipant && !isAdmin) return null;
  return <CountBadge count={isAdmin ? admin.data : participant.data} />;
}
