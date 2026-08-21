"use client";

import { redirect } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { CheckoutResultBanner, SubscriptionPanel } from "@/features/billing";
import { PHASE1_FREE } from "@/shared/config/featureFlags";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * Recruiting is free during phases 1–2, so this page has no audience —
 * forward to the dashboard instead of showing a dead subscription screen.
 * Flip PHASE1_FREE to restore it; CheckoutResultBanner and SubscriptionPanel
 * are kept, unused, as that revert path.
 */
export default function RecruiterSubscriptionPage() {
  if (PHASE1_FREE) {
    redirect("/dashboard");
  }

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-3xl flex-col gap-6">
          <PageHeader
            title="Subscription"
            subtitle="A monthly subscription unlocks the job map, job list and candidate submissions."
          />
          <CheckoutResultBanner
            param="checkout"
            successMessage="Subscription started — your access unlocks as soon as Stripe confirms the payment."
            cancelMessage="Checkout canceled. You have not been charged."
          />
          <SubscriptionPanel />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
