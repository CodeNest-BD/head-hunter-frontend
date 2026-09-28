"use client";

import { StatCard } from "@/shared/ui-components/dashboard/DashboardParts";
import { formatMinor } from "@/shared/utils/money";
import { useWallet } from "../hooks/useBilling";

/**
 * Balance at a glance. "Available" leads because it is the number that governs
 * what the company can post and offer against; balance and the held escrow
 * explain it. All three wear the same stat card — the reference defines no
 * emphasised variant, so one figure never out-shouts its neighbours.
 */
export function WalletSummary() {
  const { data } = useWallet();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="Available to spend"
        value={formatMinor(data?.availableMinor)}
        hint="Spendable on new offers"
      />
      <StatCard
        label="Balance"
        value={formatMinor(data?.balanceMinor)}
        hint="Everything loaded into your wallet"
      />
      <StatCard
        label="Held in escrow"
        value={formatMinor(data?.reservedMinor)}
        hint="Fees held for your accepted hires"
      />
    </div>
  );
}
