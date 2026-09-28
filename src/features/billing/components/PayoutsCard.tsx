"use client";

import { Landmark } from "lucide-react";

import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { Tile } from "@/shared/ui-components/list/Tile";
import { usePayoutAccount } from "../hooks/useBilling";
import { useBillingRefreshBurst } from "../hooks/useBillingRefreshBurst";
import { billingKeys } from "../keys";
import { ARRIVAL_WINDOW_LABEL, bankLabel } from "../payoutTracking";
import {
  MIN_PAYOUT_MINOR,
  type PayoutAccount,
  type RecruiterWalletSummary,
} from "../schemas";
import { AddBankAccountDialog } from "./AddBankAccountDialog";
import { WithdrawDialog } from "./WithdrawDialog";

// Bank verification only moves the payout account and the wallet's available
// figure — bursting the whole billing tree would refetch placement/payout
// history that cannot have changed.
const BANK_REFRESH_KEYS = [
  billingKeys.payoutAccount,
  billingKeys.recruiterWallet,
];

/** Copy for each not-yet-verified state; the dialog is the single CTA. */
const SETUP_COPY: Record<
  Exclude<PayoutAccount["status"], "verified">,
  { headline: string; detail: string; action: string }
> = {
  none: {
    headline: "Add your bank account",
    detail:
      "Tell us who's getting paid and where — two short steps, right here. " +
      `Withdrawals land in your account in ${ARRIVAL_WINDOW_LABEL}.`,
    action: "Add bank account",
  },
  onboarding: {
    headline: "Finish payout setup",
    detail: "Almost there — a step or two left before you can withdraw.",
    action: "Continue setup",
  },
  pending_verification: {
    headline: "Verifying your details",
    detail:
      "Stripe is verifying your identity. This usually takes a few minutes; " +
      "withdrawing unlocks as soon as it clears.",
    action: "Edit details",
  },
  restricted: {
    headline: "Payouts paused",
    detail: "Your payout details need an update before withdrawals resume.",
    action: "Update details",
  },
};

/**
 * The recruiter's payout surface: add/repair the bank account entirely in-app
 * (no Stripe redirect), and withdraw the released balance once verified. All
 * the state machinery (five account states, balance gating) stays inside.
 */
export function PayoutsCard({ wallet }: { wallet?: RecruiterWalletSummary }) {
  const account = usePayoutAccount();
  // A just-added bank sits in Stripe verification for a short window — burst
  // the affected queries so the card flips to verified without a manual refresh.
  const refresh = useBillingRefreshBurst(BANK_REFRESH_KEYS);

  // undefined means the balance is unknown (wallet still loading, failed, or
  // the backend doesn't report it yet) — distinct from a real $0, so a load
  // hiccup never renders as "your balance is below the minimum".
  const availableMinor = wallet?.availableMinor;
  const pendingMinor = wallet?.pendingPayoutMinor ?? 0;
  const belowMinimum =
    availableMinor !== undefined && availableMinor < MIN_PAYOUT_MINOR;

  return (
    <Card>
      <CardHeader className="items-start">
        <Tile icon={Landmark} tone="blue" />
        <div className="min-w-0 flex-1">
          <CardTitle>Payouts</CardTitle>
          <CardDescription className="mt-[3px]">
            Move your released commission to your bank whenever you like.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {account.isPending ? (
          <div className="h-16 animate-pulse rounded-sm bg-surface-sunken" />
        ) : account.isError ? (
          <ErrorRetryCallout
            message="Could not load your payout account."
            onRetry={() => void account.refetch()}
          />
        ) : account.data.status === "verified" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-block font-[550] text-ink">
                {bankLabel(account.data)}
              </p>
              <p className="mt-[3px] text-sub text-ink-muted">
                {pendingMinor > 0
                  ? `${formatMinor(pendingMinor)} on its way to your bank.`
                  : `Withdrawals arrive in ${ARRIVAL_WINDOW_LABEL} · minimum ${formatMinor(MIN_PAYOUT_MINOR)}.`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AddBankAccountDialog
                account={account.data}
                onBankSubmitted={refresh.start}
              >
                <Button type="button" variant="ghost" size="sm">
                  Update bank
                </Button>
              </AddBankAccountDialog>
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
              <p className="text-block font-[550] text-ink">
                {SETUP_COPY[account.data.status].headline}
              </p>
              <p className="mt-[3px] text-sub text-ink-muted">
                {account.data.status === "restricted" &&
                account.data.disabledReason
                  ? account.data.disabledReason
                  : SETUP_COPY[account.data.status].detail}
              </p>
            </div>
            <div className="shrink-0">
              <AddBankAccountDialog
                account={account.data}
                onBankSubmitted={refresh.start}
              >
                <Button
                  type="button"
                  variant={
                    account.data.status === "pending_verification"
                      ? "outline"
                      : "default"
                  }
                >
                  {SETUP_COPY[account.data.status].action}
                </Button>
              </AddBankAccountDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
