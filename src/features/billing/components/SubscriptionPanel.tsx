"use client";

import { BadgeCheck, CreditCard, Lock } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import {
  useOpenSubscriptionPortal,
  useStartSubscriptionCheckout,
  useSubscription,
} from "../hooks/useBilling";
import type { SubscriptionStatus } from "../schemas";

const STATUS_COPY: Record<
  SubscriptionStatus["status"],
  { title: string; body: string }
> = {
  none: {
    title: "No subscription yet",
    body: "Subscribe to unlock the job map and start submitting candidates.",
  },
  incomplete: {
    title: "Payment incomplete",
    body: "Your last checkout didn't finish. Start again to activate your access.",
  },
  active: {
    title: "Subscription active",
    body: "You have full access to the marketplace.",
  },
  past_due: {
    title: "Payment past due",
    body: "Your last payment failed. Update your card to keep your access.",
  },
  canceled: {
    title: "Subscription canceled",
    body: "Resubscribe any time to regain access to the marketplace.",
  },
};

function periodEndLabel(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Subscription state + the two Stripe actions: subscribe and manage. */
export function SubscriptionPanel() {
  const { data, isLoading } = useSubscription();
  const checkout = useStartSubscriptionCheckout();
  const portal = useOpenSubscriptionPortal();

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Loading subscription…
        </CardContent>
      </Card>
    );
  }

  const copy = STATUS_COPY[data.status];
  const isActive = data.status === "active";
  const renewsOn = periodEndLabel(data.currentPeriodEnd);

  return (
    <Card
      className={
        isActive ? "border-[#CDE7D8] bg-[#E7F4EC]" : "border-border bg-card"
      }
    >
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
            (isActive ? "bg-white text-[#17734E]" : "bg-accent text-primary")
          }
        >
          {isActive ? (
            <BadgeCheck className="h-[18px] w-[18px]" />
          ) : (
            <Lock className="h-[18px] w-[18px]" />
          )}
        </span>
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading tracking-tight">
            {copy.title}
          </CardTitle>
          <CardDescription>
            {copy.body}
            {isActive && renewsOn && (
              <>
                {" "}
                Renews on{" "}
                <span className="font-medium text-foreground">{renewsOn}</span>.
              </>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {isActive || data.status === "past_due" ? (
          <Button
            type="button"
            variant={isActive ? "outline" : "default"}
            disabled={portal.isPending}
            onClick={() => portal.mutate()}
          >
            <CreditCard className="h-[18px] w-[18px]" />
            {portal.isPending ? "Opening…" : "Manage billing"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending ? "Redirecting…" : "Subscribe"}
          </Button>
        )}
        {(checkout.isError || portal.isError) && (
          <p className="w-full text-sm text-destructive">
            Something went wrong talking to Stripe. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
