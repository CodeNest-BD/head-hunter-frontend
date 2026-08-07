"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

import { majorInputToMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { useStartTopUp } from "../hooks/useBilling";

const MIN_MAJOR = 10;
const MAX_MAJOR = 50_000;
const PRESETS = [500, 1_000, 2_500, 5_000];

/**
 * Starts a Stripe Checkout for loading funds. The wallet is credited by the
 * payment webhook, so returning from Stripe with `?topup=success` only means
 * the payment went through — the balance query refetches on focus and catches
 * up within moments.
 */
export function TopUpCard() {
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const topUp = useStartTopUp();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minor = majorInputToMinor(amount);
    if (minor === null || minor < MIN_MAJOR * 100 || minor > MAX_MAJOR * 100) {
      setValidationError(
        `Enter an amount between $${MIN_MAJOR.toLocaleString()} and $${MAX_MAJOR.toLocaleString()}.`,
      );
      return;
    }
    setValidationError(null);
    topUp.mutate(minor);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <CreditCard className="h-[18px] w-[18px]" />
        </span>
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading tracking-tight">
            Load funds
          </CardTitle>
          <CardDescription>
            Add money to your wallet so you can publish jobs. You&apos;ll pay
            securely on Stripe.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(preset))}
              >
                ${preset.toLocaleString()}
              </Button>
            ))}
          </div>
          <div className="flex max-w-sm flex-col gap-1.5">
            <Label htmlFor="topup-amount">Amount (USD)</Label>
            <Input
              id="topup-amount"
              inputMode="decimal"
              placeholder="1000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            {topUp.isError && (
              <p className="text-sm text-destructive">
                Could not start the checkout. Please try again.
              </p>
            )}
          </div>
          <div>
            <Button type="submit" disabled={topUp.isPending}>
              {topUp.isPending ? "Redirecting…" : "Continue to payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
