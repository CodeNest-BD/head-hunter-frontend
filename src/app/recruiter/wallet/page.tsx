"use client";

import { RequireRole } from "@/features/auth";
import { RecruiterWalletPanel } from "@/features/billing";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function RecruiterWalletPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <PageHeader
            title="Wallet"
            subtitle="Your commissions: paid out, held in escrow during the 30-day window, and anything under dispute."
          />
          <RecruiterWalletPanel />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
