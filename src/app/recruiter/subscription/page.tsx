"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { CheckoutResultBanner, SubscriptionPanel } from "@/features/billing";
import { PHASE1_FREE } from "@/shared/config/featureFlags";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/** Shown while recruiting is free (phases 1–2). */
function FreeDuringLaunchCard() {
  return (
    <div className="rounded-md border border-brand-line bg-card p-8 text-center shadow-card">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
        <BadgeCheck className="h-6 w-6" />
      </span>
      <h2 className="font-heading text-xl font-extrabold text-foreground">
        Recruiting is free during launch
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        There is no subscription right now — every verified recruiter gets full
        access to the live job map and candidate submissions. Get verified from
        your{" "}
        <Link
          href="/recruiter/profile"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          profile
        </Link>{" "}
        and start earning.
      </p>
    </div>
  );
}

export default function RecruiterSubscriptionPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-3xl flex-col gap-6">
          <PageHeader
            title="Subscription"
            subtitle={
              PHASE1_FREE
                ? "Free for recruiters while we launch."
                : "A monthly subscription unlocks the job map, job list and candidate submissions."
            }
          />
          {PHASE1_FREE ? (
            <FreeDuringLaunchCard />
          ) : (
            <>
              <CheckoutResultBanner
                param="checkout"
                successMessage="Subscription started — your access unlocks as soon as Stripe confirms the payment."
                cancelMessage="Checkout canceled. You have not been charged."
              />
              <SubscriptionPanel />
            </>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
