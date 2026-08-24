"use client";

import type { ReactNode } from "react";

import { CompanyApprovalBanner } from "@/features/companies/components/CompanyApprovalBanner";
import { useCompanyApprovalGate } from "@/features/companies/hooks/useCompanyApprovalGate";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";

/** Matches the loading placeholder used across the company pages. */
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-56 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    </div>
  );
}

/**
 * Route-level companion to the server's global approval gate — the company
 * mirror of RequireApprovedRecruiter. Renders the approval banner instead of
 * the page, so a pending or declined company gets an explanation rather than a
 * wall of failed requests.
 *
 * Leave `/company/profile` and `/notifications` ungated — they're the server's
 * allow-list, so wrapping them here would trap the user with no way to see the
 * admin's note or act on it.
 */
export function RequireApprovedCompany({ children }: { children: ReactNode }) {
  const { isApproved, isLoading, isError, retry } = useCompanyApprovalGate();

  if (isLoading) {
    return <PageSkeleton />;
  }
  // A failed profile fetch also leaves `isApproved` false, but that isn't "not
  // yet approved" — it's "we don't know", and the banner renders nothing for an
  // undefined status, which would leave a blank page on every transient failure.
  if (isError) {
    return (
      <ErrorRetryCallout
        message="Could not load your approval status."
        onRetry={retry}
      />
    );
  }
  if (!isApproved) {
    return <CompanyApprovalBanner />;
  }
  return <>{children}</>;
}
