"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { RequireRole } from "@/features/auth";
import {
  CheckoutResultBanner,
  LedgerTable,
  TopUpCard,
  WalletSummary,
  billingKeys,
} from "@/features/billing";
import { PageBanner } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

// The wallet is credited by the Stripe webhook, which usually lands a moment
// after the browser returns from checkout. Poll the balance briefly so it
// appears without a manual refresh.
const REFRESH_TICKS = 6;
const REFRESH_INTERVAL_MS = 2500;

const RESERVE_STEPS: readonly { title: string; detail: string }[] = [
  {
    title: "You publish a job",
    detail: "Its recruiter fee moves from available to reserved.",
  },
  {
    title: "Recruiters submit candidates",
    detail: "The reserve stays untouched while you review.",
  },
  {
    title: "Filled or closed",
    detail: "Paid to the recruiter on a hire, or returned to available.",
  },
];

function HowReservedFeesWork() {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="font-heading text-base font-bold text-navy">
        How reserved fees work
      </h2>
      <ol className="mt-4 flex flex-col gap-4">
        {RESERVE_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{step.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WalletContent() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onCheckoutResult = useCallback((result: "success" | "canceled") => {
    if (result === "success") setRefreshing(true);
  }, []);

  useEffect(() => {
    if (!refreshing) return;
    let ticks = 0;
    void queryClient.invalidateQueries({ queryKey: billingKeys.all });
    const id = setInterval(() => {
      ticks += 1;
      void queryClient.invalidateQueries({ queryKey: billingKeys.all });
      if (ticks >= REFRESH_TICKS) {
        clearInterval(id);
        setRefreshing(false);
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshing, queryClient]);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageBanner
        title="Wallet"
        subtitle="Load funds once, then publish jobs against your balance. Fees stay reserved until a role is filled or closed."
        actions={
          <Link
            href="#load-funds"
            className="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Load funds
          </Link>
        }
      />
      <CheckoutResultBanner
        param="topup"
        successMessage="Payment received — your balance will update in a moment."
        cancelMessage="Top-up canceled. No payment was taken."
        onResult={onCheckoutResult}
      />
      <WalletSummary />
      <div id="load-funds" className="grid gap-4 lg:grid-cols-2">
        <TopUpCard />
        <HowReservedFeesWork />
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-navy">History</h2>
        <LedgerTable />
      </section>
    </div>
  );
}

export default function CompanyWalletPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <WalletContent />
      </DashboardLayout>
    </RequireRole>
  );
}
