"use client";

import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
import { Money } from "@/shared/ui-components/data/MoneyVisibility";
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
        value={<Money minor={data?.availableMinor} />}
        hint="Spendable on new job posts"
      />
      <StatCard
        label="Balance"
        value={<Money minor={data?.balanceMinor} />}
        hint="Everything loaded into your wallet"
      />
      <StatCard
        label="Reserved"
        value={<Money minor={data?.reservedMinor} />}
        hint="Held for your published jobs"
      />
    </div>
  );
}
