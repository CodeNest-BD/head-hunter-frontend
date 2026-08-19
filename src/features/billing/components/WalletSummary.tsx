"use client";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useWallet } from "../hooks/useBilling";

interface MetricProps {
  label: string;
  valueMinor: number | undefined;
  hint: string;
  primary?: boolean;
}

function Metric({ label, valueMinor, hint, primary = false }: MetricProps) {
  return (
    <div className="flex-1 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading font-extrabold leading-none text-navy",
          primary ? "text-3xl text-primary" : "text-2xl",
        )}
      >
        {valueMinor === undefined ? "—" : formatMinor(valueMinor)}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * Balance at a glance. "Available" leads because it is the number that governs
 * what the company can actually publish; balance and reserved explain it.
 */
export function WalletSummary() {
  const { data } = useWallet();

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col divide-y divide-border p-0 sm:flex-row sm:divide-x sm:divide-y-0">
        <Metric
          label="Available to spend"
          valueMinor={data?.availableMinor}
          hint="Spendable on new job posts"
          primary
        />
        <Metric
          label="Balance"
          valueMinor={data?.balanceMinor}
          hint="Everything loaded into your wallet"
        />
        <Metric
          label="Reserved"
          valueMinor={data?.reservedMinor}
          hint="Held for your published jobs"
        />
      </CardContent>
    </Card>
  );
}
