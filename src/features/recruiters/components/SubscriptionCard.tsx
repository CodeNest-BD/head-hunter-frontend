"use client";

import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { useDevActivateSubscription } from "../hooks/useRecruiterProfile";
import type { RecruiterProfile } from "../schemas";

interface SubscriptionCardProps {
  profile: RecruiterProfile;
}

/**
 * Explains the paywall rather than letting the recruiter discover it as a 403
 * on the job map. Subscribing happens on the subscription page (Stripe
 * Checkout); the dev-activate shortcut remains for local work without Stripe.
 */
export function SubscriptionCard({ profile }: SubscriptionCardProps) {
  const activate = useDevActivateSubscription();
  const isDevelopment = process.env.NODE_ENV === "development";

  if (profile.hasMarketplaceAccess) {
    return (
      <Card className="border-[#CDE7D8] bg-[#E7F4EC]">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#17734E]">
            <CheckCircle2 className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col gap-1">
            <CardTitle className="font-heading tracking-tight">
              Subscription active
            </CardTitle>
            <CardDescription>
              You have full access to the job map and job list.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-[#F0E2B8] bg-[#FBF3DF]">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#92610C]">
          <Lock className="h-[18px] w-[18px]" />
        </span>
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading tracking-tight">
            Subscription required
          </CardTitle>
          <CardDescription>
            Jobs are only visible to subscribed recruiters. Your status is{" "}
            <span className="font-medium text-foreground">
              {profile.subscriptionStatus}
            </span>
            .
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Subscribe with a card on the subscription page — access unlocks as
          soon as Stripe confirms the payment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/recruiter/subscription">Go to subscription</Link>
          </Button>
          {isDevelopment && (
            <Button
              type="button"
              variant="outline"
              disabled={activate.isPending}
              onClick={() => activate.mutate()}
            >
              {activate.isPending
                ? "Activating…"
                : "Activate (development only)"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
