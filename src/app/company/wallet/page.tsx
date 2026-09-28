"use client";

import { useCallback } from "react";
import Link from "next/link";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import {
  CheckoutResultBanner,
  CompanyPlacementsPanel,
  LedgerTable,
  TopUpCard,
  WalletSummary,
  useBillingRefreshBurst,
} from "@/features/billing";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

const RESERVE_STEPS: readonly { title: string; detail: string }[] = [
  {
    title: "A candidate accepts your offer",
    detail: "Its recruiter fee is held in escrow, out of your available funds.",
  },
  {
    title: "The candidate joins",
    detail:
      "The fee stays held through a 30-day release countdown from the joining date.",
  },
  {
    title: "Released or refunded",
    detail:
      "Paid to the recruiter after 30 days — or refunded to you if you reject the hire before the joining date, or a dispute is resolved in your favour.",
  },
];

function HowReservedFeesWork() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How Held Fees Work</CardTitle>
      </CardHeader>
      <CardContent>
        {/* `.steps` — the hold mechanic explained in plain language, right
            where money enters the wallet. */}
        <ol className="flex flex-col gap-3">
          {RESERVE_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-[11px]">
              <span className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-tint text-[11.5px] font-bold text-blue">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-block font-[550] text-ink">{step.title}</p>
                <p className="text-sub text-ink-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function WalletContent() {
  // The wallet is credited by the Stripe webhook, which usually lands a moment
  // after the browser returns from checkout — burst-refresh so the balance
  // appears without a manual refresh.
  const refresh = useBillingRefreshBurst();
  const startRefresh = refresh.start;

  const onCheckoutResult = useCallback(
    (result: "success" | "canceled") => {
      if (result === "success") startRefresh();
    },
    [startRefresh],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Wallet"
        subtitle="Load funds once, then post jobs and make offers against your balance. A recruiter fee is held in escrow only when a candidate accepts your offer."
        actions={
          <Button asChild>
            <Link href="#load-funds">Load funds</Link>
          </Button>
        }
      />
      <CheckoutResultBanner
        param="topup"
        successMessage="Payment received — your balance will update in a moment."
        cancelMessage="Top-up canceled. No payment was taken."
        onResult={onCheckoutResult}
      />
      <WalletSummary />
      <div id="load-funds" className="grid gap-3 lg:grid-cols-2">
        <TopUpCard />
        <HowReservedFeesWork />
      </div>
      <CompanyPlacementsPanel />
      <section className="flex flex-col gap-3">
        <h2 className="text-section font-bold text-ink">History</h2>
        <LedgerTable />
      </section>
    </div>
  );
}

export default function CompanyWalletPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <RequireApprovedCompany>
          <WalletContent />
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
