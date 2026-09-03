"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { majorInputToMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
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

  const selectedPreset = PRESETS.find((preset) => String(preset) === amount);

  const setPreset = (preset: number) => {
    setAmount(String(preset));
    setValidationError(null);
  };

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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
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
        <form onSubmit={submit} className="flex max-w-md flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-navy">
              Choose an amount
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((preset) => {
                const active = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPreset(preset)}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input text-navy hover:border-primary hover:text-primary",
                    )}
                  >
                    ${preset.toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topup-amount">Or enter a custom amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-muted-foreground">
                $
              </span>
              <NumericInput
                decimal
                id="topup-amount"
                placeholder="1000"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setValidationError(null);
                }}
                className="pl-7 text-[15px]"
              />
            </div>
            {validationError ? (
              <p className="text-sm text-destructive">{validationError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Between ${MIN_MAJOR.toLocaleString()} and $
                {MAX_MAJOR.toLocaleString()}.
              </p>
            )}
            {topUp.isError && (
              <p className="text-sm text-destructive">
                Could not start the checkout. Please try again.
              </p>
            )}
          </div>

          <div>
            <Button
              type="submit"
              disabled={topUp.isPending}
              className="w-full sm:w-auto sm:px-8"
            >
              {topUp.isPending ? "Redirecting…" : "Continue to payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
