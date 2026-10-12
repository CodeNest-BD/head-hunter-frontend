"use client";

import { QuickViewBand } from "@/shared/ui-components/dashboard/DashboardParts";
import { formatMinor } from "@/shared/utils/money";
import { useWallet } from "../hooks/useBilling";

/**
 * Balance at a glance. "Available" leads because it is the number that governs
 * what the company can post and offer against; balance and the held escrow
 * explain it. All three sit on one surface, split by hairlines — the same band
 * every other summary in the app uses, so no figure out-shouts its neighbours.
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
          value: formatMinor(data?.availableMinor),
          note: "Spendable on new offers",
          tone: "ok",
        },
        {
          key: "balance",
          label: "Balance",
          value: formatMinor(data?.balanceMinor),
          note: "Everything loaded into your wallet",
          tone: "neutral",
        },
        {
          key: "escrow",
          label: "Held In Escrow",
          value: formatMinor(data?.reservedMinor),
          note: "Fees held for your accepted hires",
          tone: "info",
        },
      ]}
    />
  );
}
