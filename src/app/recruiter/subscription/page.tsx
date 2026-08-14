"use client";

import { RequireRole } from "@/features/auth";
import { CheckoutResultBanner, SubscriptionPanel } from "@/features/billing";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function RecruiterSubscriptionPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-3xl flex-col gap-8">
          <PageHeader title="Subscription" />
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
