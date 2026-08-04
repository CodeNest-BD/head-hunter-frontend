"use client";

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
 * on the job map. The activate button is a temporary stand-in for Stripe
 * Checkout and disappears with the backend endpoint.
 */
export function SubscriptionCard({ profile }: SubscriptionCardProps) {
  const activate = useDevActivateSubscription();

  if (profile.hasMarketplaceAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription active</CardTitle>
          <CardDescription>
            You have full access to the job map and job list.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardHeader>
        <CardTitle>Subscription required</CardTitle>
        <CardDescription>
          Jobs are only visible to subscribed recruiters. Your status is{" "}
          <span className="font-medium">{profile.subscriptionStatus}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Card payment is not wired up yet. Until it is, you can activate a
          development subscription to try the marketplace.
        </p>
        <div>
          <Button
            type="button"
            disabled={activate.isPending}
            onClick={() => activate.mutate()}
          >
            {activate.isPending ? "Activating…" : "Activate (development only)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
