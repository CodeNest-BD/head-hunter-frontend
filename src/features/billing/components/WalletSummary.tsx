"use client";

import { CircleDollarSign, Lock, Wallet2 } from "lucide-react";

import { QuickViewBand } from "@/shared/ui-components/dashboard/DashboardParts";
import { formatMinor } from "@/shared/utils/money";
import { useWallet } from "../hooks/useBilling";

/**
 * Balance at a glance. "Available" leads because it is the number that governs
 * what the company can post and offer against; balance and the held escrow
 * explain it. All three wear the same summary card every other band in the app
 * uses, so no figure out-shouts its neighbours.
 */
export function WalletSummary() {
  const { data } = useWallet();

  return (
    <QuickViewBand
      label="Wallet summary"
      views={[
        {
          key: "available",
          label: "Available To Spend",
          icon: Wallet2,
          value: formatMinor(data?.availableMinor),
          note: "Spendable on new offers",
        },
        {
          key: "balance",
          label: "Balance",
          icon: CircleDollarSign,
          value: formatMinor(data?.balanceMinor),
          note: "Everything loaded into your wallet",
        },
        {
          key: "escrow",
          label: "Held In Escrow",
          icon: Lock,
          value: formatMinor(data?.reservedMinor),
          note: "Fees held for your accepted hires",
        },
      ]}
    />
  );
}
