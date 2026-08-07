"use client";

import { Landmark, LockKeyhole, Wallet2 } from "lucide-react";

import { formatMinor } from "@/shared/utils/money";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useWallet } from "../hooks/useBilling";

interface StatCardProps {
  label: string;
  valueMinor: number | undefined;
  hint: string;
  icon: React.ReactNode;
}

function StatCard({ label, valueMinor, hint, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-navy">
            {valueMinor === undefined ? "—" : formatMinor(valueMinor)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Balance / reserved / available at a glance. */
export function WalletSummary() {
  const { data } = useWallet();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Balance"
        valueMinor={data?.balanceMinor}
        hint="Everything loaded into your wallet"
        icon={<Wallet2 className="h-[18px] w-[18px]" />}
      />
      <StatCard
        label="Reserved"
        valueMinor={data?.reservedMinor}
        hint="Held for your published jobs"
        icon={<LockKeyhole className="h-[18px] w-[18px]" />}
      />
      <StatCard
        label="Available"
        valueMinor={data?.availableMinor}
        hint="Spendable on new job posts"
        icon={<Landmark className="h-[18px] w-[18px]" />}
      />
    </div>
  );
}
