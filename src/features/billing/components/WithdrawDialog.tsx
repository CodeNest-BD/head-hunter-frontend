"use client";

import { useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import {
  formatMinor,
  majorInputToMinor,
  minorToMajorInput,
} from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { useWithdraw } from "../hooks/useBilling";
import { ARRIVAL_WINDOW_LABEL } from "../payoutTracking";
import { MIN_PAYOUT_MINOR } from "../schemas";

/** Whole dollars, optionally with cents — no sub-cent digits to round away. */
const DOLLARS_AND_CENTS = /^\d+(\.\d{1,2})?$/;

/**
 * Validates a withdrawal amount against the floor and the available balance.
 * Returns the amount in minor units, or the message to show instead.
 */
export function validateWithdrawAmount(
  input: string,
  availableMinor: number,
): { amountMinor: number } | { error: string } {
  const trimmed = input.trim();
  const amountMinor = majorInputToMinor(trimmed);
  if (amountMinor === null || amountMinor <= 0) {
    return { error: "Enter an amount to withdraw." };
  }
  // Rejected rather than rounded: silently sending a different amount than
  // the user typed is exactly the kind of money surprise we can't have.
  if (!DOLLARS_AND_CENTS.test(trimmed)) {
    return { error: "Enter dollars and cents, like 1250.50." };
  }
  if (amountMinor < MIN_PAYOUT_MINOR) {
    return {
      error: `The minimum withdrawal is ${formatMinor(MIN_PAYOUT_MINOR)}.`,
    };
  }
  if (amountMinor > availableMinor) {
    return {
      error: `You can withdraw up to ${formatMinor(availableMinor)}.`,
    };
  }
  return { amountMinor };
}

function withdrawErrorMessage(error: unknown): string {
  if (isApiError(error)) return allMessages(error);
  return "Could not start the withdrawal. Please try again.";
}

interface WithdrawDialogProps {
  availableMinor: number;
  /** The element that opens the dialog. */
  children: ReactNode;
}

/**
 * Withdraw released commission to the connected bank account. An idempotency
 * key is minted whenever the amount changes, so retrying the same amount after
 * an ambiguous failure re-sends the same request (the backend returns the
 * original payout instead of double-paying), while editing the amount is a new
 * request with a new key.
 */
export function WithdrawDialog({
  availableMinor,
  children,
}: WithdrawDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const idempotencyKey = useRef("");
  const withdraw = useWithdraw();

  const changeAmount = (next: string) => {
    setAmount(next);
    setValidationError(null);
    idempotencyKey.current = crypto.randomUUID();
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setAmount("");
      setValidationError(null);
      idempotencyKey.current = crypto.randomUUID();
      withdraw.reset();
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateWithdrawAmount(amount, availableMinor);
    if ("error" in result) {
      setValidationError(result.error);
      return;
    }
    setValidationError(null);
    withdraw.mutate(
      {
        amountMinor: result.amountMinor,
        idempotencyKey: idempotencyKey.current,
      },
      {
        onSuccess: (payout) => {
          setOpen(false);
          toast.success(
            `Withdrawal of ${formatMinor(payout.amountMinor)} started — it arrives in ${ARRIVAL_WINDOW_LABEL}.`,
          );
        },
      },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface shadow-pop focus:outline-none">
          <div className="flex items-center justify-between gap-2.5 border-b border-line px-4 py-3">
            <Dialog.Title className="text-card font-[650] text-ink">
              Withdraw Funds
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X className="size-[15px]" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="flex flex-col">
            <div className="flex flex-col gap-4 p-4">
              <Dialog.Description className="text-sub text-ink-muted">
                Available to withdraw:{" "}
                <span className="font-[650] tabular-nums text-ink">
                  {formatMinor(availableMinor)}
                </span>
              </Dialog.Description>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="withdraw-amount">Amount</Label>
                  <button
                    type="button"
                    className="text-meta font-[650] text-blue-ink hover:underline"
                    onClick={() =>
                      changeAmount(minorToMajorInput(availableMinor))
                    }
                  >
                    Withdraw all
                  </button>
                </div>
                {/* `.moneywrap` — the currency mark lives inside the field. */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-body text-ink-faint">
                    $
                  </span>
                  <NumericInput
                    decimal
                    id="withdraw-amount"
                    placeholder="500"
                    value={amount}
                    onChange={(event) => changeAmount(event.target.value)}
                    className="pl-6 tabular-nums"
                  />
                </div>
                {validationError ? (
                  <p className="text-meta font-medium text-bad">
                    {validationError}
                  </p>
                ) : (
                  <p className="text-meta text-ink-faint">
                    Minimum {formatMinor(MIN_PAYOUT_MINOR)} · no fee · arrives
                    in {ARRIVAL_WINDOW_LABEL}.
                  </p>
                )}
                {withdraw.isError && (
                  <p className="text-meta font-medium text-bad">
                    {withdrawErrorMessage(withdraw.error)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={withdraw.isPending}>
                {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
