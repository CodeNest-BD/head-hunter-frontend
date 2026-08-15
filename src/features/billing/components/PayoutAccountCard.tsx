"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Banknote, TriangleAlert } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  usePayoutAccount,
  useStartPayoutOnboarding,
} from "../hooks/useBilling";

const COPY = {
  not_connected: {
    icon: Banknote,
    tone: "border-[#F0E2B8] bg-[#FBF3DF] text-[#92610C]",
    title: "No payout account",
    body: "Connect a payout account so your commissions can be transferred to your bank when escrow releases.",
    cta: "Connect payout account",
  },
  onboarding_incomplete: {
    icon: TriangleAlert,
    tone: "border-[#F0E2B8] bg-[#FBF3DF] text-[#92610C]",
    title: "Payout setup incomplete",
    body: "Stripe still needs some details before payouts can be enabled. Resume onboarding to finish.",
    cta: "Resume onboarding",
  },
  enabled: {
    icon: BadgeCheck,
    tone: "border-[#CDE7D8] bg-[#E7F4EC] text-[#17734E]",
    title: "Payout account active",
    body: "Released commissions are transferred to your connected bank account automatically.",
    cta: null,
  },
} as const;

/**
 * Stripe Connect onboarding state for the recruiter wallet. Returning from
 * Stripe lands here with ?connect=return|refresh: `return` re-checks the
 * account live (the webhook can lag the redirect); `refresh` means the
 * single-use onboarding link expired and a new one is needed.
 */
export function PayoutAccountCard() {
  const searchParams = useSearchParams();
  const connectParam = searchParams.get("connect");
  const liveRefresh = connectParam === "return";

  const { data, isPending, isError } = usePayoutAccount(liveRefresh);
  const onboarding = useStartPayoutOnboarding();

  const copy = useMemo(() => (data ? COPY[data.status] : null), [data]);

  if (isPending) {
    return (
      <div className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
    );
  }
  if (isError || !data || !copy) {
    // The wallet still works without this card; degrade quietly.
    return null;
  }

  const Icon = copy.icon;
  const busy = onboarding.isPending;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              copy.tone,
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-bold text-navy">{copy.title}</p>
            <p className="text-sm text-muted-foreground">
              {connectParam === "refresh" && data.status !== "enabled"
                ? "Your onboarding session expired — start again below."
                : copy.body}
            </p>
          </div>
        </div>
        {copy.cta && (
          <Button
            type="button"
            disabled={busy}
            onClick={() => onboarding.mutate()}
          >
            {busy ? "Redirecting…" : copy.cta}
          </Button>
        )}
      </CardContent>
      {onboarding.isError && (
        <CardContent className="pt-0">
          <p className="text-sm text-destructive">
            Could not start onboarding. Please try again.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
