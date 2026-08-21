"use client";

import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
import { formatMinor } from "@/shared/utils/money";
import { useWallet } from "../hooks/useBilling";

/**
 * Balance at a glance. "Available" leads in navy because it is the number that
 * governs what the company can publish; balance and reserved explain it.
 */
export function WalletSummary() {
  const { data } = useWallet();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        tone="navy"
        label="Available to spend"
        value={formatMinor(data?.availableMinor)}
        hint="Spendable on new job posts"
      />
      <StatCard
        label="Balance"
        value={formatMinor(data?.balanceMinor)}
        hint="Everything loaded into your wallet"
      />
      <StatCard
        label="Reserved"
        value={formatMinor(data?.reservedMinor)}
        hint="Held for your published jobs"
      />
    </div>
  );
}
