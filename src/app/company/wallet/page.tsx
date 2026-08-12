"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RequireRole } from "@/features/auth";
import {
  CheckoutResultBanner,
  LedgerTable,
  TopUpCard,
  WalletSummary,
  billingKeys,
} from "@/features/billing";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

// The wallet is credited by the Stripe webhook, which usually lands a moment
// after the browser returns from checkout. Poll the balance briefly so it
// appears without a manual refresh.
const REFRESH_TICKS = 6;
const REFRESH_INTERVAL_MS = 2500;

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        eyebrow="Billing"
        title="Wallet"
        subtitle="Load funds once, then publish jobs against your balance. Fees stay reserved until a role is filled or closed."
      />
      <CheckoutResultBanner
        param="topup"
        successMessage="Payment received — your balance will update in a moment."
        cancelMessage="Top-up canceled. No payment was taken."
        onResult={onCheckoutResult}
      />
      <WalletSummary />
      <TopUpCard />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-navy">History</h2>
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
