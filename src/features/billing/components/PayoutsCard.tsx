"use client";

import { AlertCircle, Landmark } from "lucide-react";

import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import {
  usePayoutAccount,
  useStartPayoutOnboarding,
} from "../hooks/useBilling";
import {
  MIN_PAYOUT_MINOR,
  type PayoutAccount,
  type RecruiterWalletSummary,
} from "../schemas";
import { WithdrawDialog } from "./WithdrawDialog";

function bankLabel(account: PayoutAccount): string {
  if (!account.bankLast4) return "Bank account connected";
  return account.bankName
    ? `${account.bankName} •••• ${account.bankLast4}`
    : `Bank account •••• ${account.bankLast4}`;
}

/** Copy for each account state; the onboarding CTA reuses one mutation. */
const ONBOARDING_CTA: Record<
  Exclude<PayoutAccount["status"], "verified">,
  { headline: string; detail: string; action: string }
> = {
  none: {
    headline: "Set up payouts",
    detail:
      "Connect a bank account to withdraw your commission. Identity and bank details are collected securely on Stripe.",
    action: "Set up payouts",
  },
  onboarding: {
    headline: "Finish payout setup",
    detail:
      "Your Stripe setup isn't finished yet — resume where you left off to start withdrawing.",
    action: "Resume setup",
  },
  pending_verification: {
    headline: "Verification pending",
    detail:
      "Stripe is verifying your details. This usually takes a few minutes; withdrawing unlocks as soon as it clears.",
    action: "Review details",
  },
  restricted: {
    headline: "Payouts paused",
    detail:
      "Stripe needs more information before it can pay this account again.",
    action: "Fix on Stripe",
  },
};

/**
 * The recruiter's payout surface: connect/repair the Stripe payout account,
 * and withdraw the released balance once the account is verified. All the
 * state machinery (five account states, balance gating) stays inside.
 */
export function PayoutsCard({ wallet }: { wallet?: RecruiterWalletSummary }) {
  const account = usePayoutAccount();
  const onboarding = useStartPayoutOnboarding();

  // undefined means the balance is unknown (wallet still loading, failed, or
  // the backend doesn't report it yet) — distinct from a real $0, so a load
  // hiccup never renders as "your balance is below the minimum".
  const availableMinor = wallet?.availableMinor;
  const pendingMinor = wallet?.pendingPayoutMinor ?? 0;
  const belowMinimum =
    availableMinor !== undefined && availableMinor < MIN_PAYOUT_MINOR;

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <Landmark className="h-[18px] w-[18px]" />
        </span>
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading tracking-tight">Payouts</CardTitle>
          <CardDescription>
            Move your released commission to your bank whenever you like.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {account.isPending ? (
          <div className="h-16 animate-pulse rounded-md bg-muted/40" />
        ) : account.isError ? (
          <div className="flex items-center gap-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Could not load your payout account.
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void account.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : account.data.status === "verified" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">
                {bankLabel(account.data)}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {pendingMinor > 0
                  ? `${formatMinor(pendingMinor)} on its way to your bank.`
                  : `Withdrawals arrive in 2–3 business days · minimum ${formatMinor(MIN_PAYOUT_MINOR)}.`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={onboarding.isPending}
                onClick={() => onboarding.mutate()}
              >
                Update bank
              </Button>
              <WithdrawDialog availableMinor={availableMinor ?? 0}>
                <Button
                  type="button"
                  disabled={availableMinor === undefined || belowMinimum}
                  title={
                    belowMinimum
                      ? `Withdrawing unlocks at ${formatMinor(MIN_PAYOUT_MINOR)} available.`
                      : undefined
                  }
                >
                  Withdraw
                </Button>
              </WithdrawDialog>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">
                {ONBOARDING_CTA[account.data.status].headline}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {account.data.status === "restricted" &&
                account.data.disabledReason
                  ? account.data.disabledReason
                  : ONBOARDING_CTA[account.data.status].detail}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <Button
                type="button"
                disabled={onboarding.isPending}
                onClick={() => onboarding.mutate()}
              >
                {onboarding.isPending
                  ? "Redirecting…"
                  : ONBOARDING_CTA[account.data.status].action}
              </Button>
              {onboarding.isError && (
                <p className="text-sm text-destructive">
                  Could not open Stripe. Please try again.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
