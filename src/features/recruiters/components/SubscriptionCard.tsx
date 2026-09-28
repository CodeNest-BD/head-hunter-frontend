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
      <Card className="border-ok-line bg-ok-bg">
        <CardHeader className="border-b-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-ok">
            <CheckCircle2 className="size-[15px]" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle>Subscription active</CardTitle>
            <CardDescription className="mt-[3px]">
              You have full access to the job map and job list.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-warn-line bg-warn-bg">
      <CardHeader className="items-start border-warn-line">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-warn">
          <Lock className="size-[15px]" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle>Subscription required</CardTitle>
          <CardDescription className="mt-[3px]">
            Jobs are only visible to subscribed recruiters. Your status is{" "}
            <span className="font-[550] text-ink">
              {profile.subscriptionStatus}
            </span>
            .
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sub text-ink-muted">
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
