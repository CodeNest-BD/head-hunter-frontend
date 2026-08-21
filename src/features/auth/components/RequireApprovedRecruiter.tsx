"use client";

import type { ReactNode } from "react";

import { useVerificationGate } from "@/features/recruiters/hooks/useVerificationGate";
import { VerificationBanner } from "@/features/recruiters/components/VerificationBanner";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";

/** Matches the loading placeholder already used on /recruiter/profile. */
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-56 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    </div>
  );
}

/**
 * Route-level companion to the server's global approval gate. Renders the
 * verification banner instead of the page, so a pending or rejected
 * recruiter gets an explanation rather than a wall of failed requests.
 *
 * Leave `/recruiter/profile` and `/notifications` ungated — they're the
 * server's allow-list, so wrapping them here would trap the user with no way
 * to see or fix their status.
 */
export function RequireApprovedRecruiter({
  children,
}: {
  children: ReactNode;
}) {
  const { isApproved, isLoading, isError, retry } = useVerificationGate();

  if (isLoading) {
    return <PageSkeleton />;
  }
  // A failed profile fetch also leaves `isApproved` false (via
  // `useIsVerifiedRecruiter`'s null status), but that isn't "not yet
  // approved" — it's "we don't know". Without this branch it fell through to
  // `VerificationBanner`, which renders nothing for a null status, leaving a
  // blank page on every transient failure instead of a way to retry.
  if (isError) {
    return (
      <ErrorRetryCallout
        message="Could not load your verification status."
        onRetry={retry}
      />
    );
  }
  if (!isApproved) {
    return <VerificationBanner />;
  }
  return <>{children}</>;
}
