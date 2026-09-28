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
import { Tile } from "@/shared/ui-components/list/Tile";
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
      <CardHeader className="items-start">
        <Tile icon={CreditCard} tone="blue" />
        <div className="min-w-0 flex-1">
          <CardTitle>Load funds</CardTitle>
          <CardDescription className="mt-[3px]">
            Add money to your wallet so you can publish jobs. You&apos;ll pay
            securely on Stripe.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex max-w-md flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-label font-[650] uppercase text-ink-muted">
              Choose an amount
            </span>
            {/* `.chip` row — presets read as selectable tags, not as buttons
                competing with the form's own submit. */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPreset(preset)}
                    className={cn(
                      "inline-flex h-7 items-center rounded-full border px-[11px] text-[12.5px] font-[550] tabular-nums transition-colors",
                      active
                        ? "border-blue bg-blue text-white"
                        : "border-line-strong bg-surface text-ink-muted hover:border-blue-ink hover:text-blue-ink",
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
            {/* `.moneywrap` — the currency mark sits inside the field so the
                figure the user types reads as money at a glance. */}
            <div className="relative">
              <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-body text-ink-faint">
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
                className="pl-6 tabular-nums"
              />
            </div>
            {validationError ? (
              <p className="text-meta font-medium text-bad">
                {validationError}
              </p>
            ) : (
              <p className="text-meta text-ink-faint">
                Between ${MIN_MAJOR.toLocaleString()} and $
                {MAX_MAJOR.toLocaleString()}.
              </p>
            )}
            {topUp.isError && (
              <p className="text-meta font-medium text-bad">
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
