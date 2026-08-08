"use client";

import { RequireRole } from "@/features/auth";
import {
  CheckoutResultBanner,
  LedgerTable,
  TopUpCard,
  WalletSummary,
} from "@/features/billing";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyWalletPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
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
          />
          <WalletSummary />
          <TopUpCard />
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-navy">History</h2>
            <LedgerTable />
          </section>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
