"use client";

import { useAuth } from "@/features/auth";
import { useAdminConversations } from "@/features/admin";

import { CountBadge } from "./CountBadge";

/**
 * How many submissions are waiting at the quality-control gate, on the admin's
 * Candidate Submissions nav item.
 *
 * Reads the caller's role itself rather than taking one, the same shape as
 * `InboxBadge` and `DisputesBadge` — the nav render sites have no user in
 * scope.
 *
 * It asks the submissions list for a single row and uses the envelope's
 * `total`, so the count comes from the same query the page itself runs and
 * needs no endpoint of its own. The admin mutations already invalidate every
 * `["admin", …]` key, so approving or rejecting clears the pill without the
 * nav knowing a review happened.
 */
export function SubmissionsBadge() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const waiting = useAdminConversations(
    { page: 1, limit: 1, status: "pending_review" },
    isAdmin,
  );
  if (!isAdmin) return null;
  return <CountBadge count={waiting.data?.meta.total} />;
}
