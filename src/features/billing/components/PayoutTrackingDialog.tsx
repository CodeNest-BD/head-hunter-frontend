"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { usePayoutAccount } from "../hooks/useBilling";
import {
  bankLabel,
  payoutReference,
  payoutTimeline,
  type PayoutTimelineState,
} from "../payoutTracking";
import {
  PAYOUT_STATUS_LABELS,
  type Payout,
  type PayoutStatus,
} from "../schemas";
import { PAYOUT_STATUS_TONES } from "../statusTones";

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <StatusBadge
      label={PAYOUT_STATUS_LABELS[status]}
      tone={PAYOUT_STATUS_TONES[status]}
    />
  );
}

const MARKER = "flex size-5 shrink-0 items-center justify-center rounded-full";

function StepMarker({ state }: { state: PayoutTimelineState }) {
  switch (state) {
    case "done":
      return (
        <span className={cn(MARKER, "bg-blue text-white")}>
          <Check className="size-3" strokeWidth={3} />
        </span>
      );
    case "current":
      return (
        <span className={cn(MARKER, "border-2 border-blue bg-surface")}>
          <span className="size-2 animate-pulse rounded-full bg-blue" />
        </span>
      );
    case "upcoming":
      return <span className={cn(MARKER, "border-2 border-line bg-surface")} />;
    case "failed":
      return (
        <span className={cn(MARKER, "bg-bad text-white")}>
          <X className="size-3" strokeWidth={3} />
        </span>
      );
    case "canceled":
      return (
        <span className={cn(MARKER, "bg-neutral-bg text-neutral")}>
          <X className="size-3" strokeWidth={3} />
        </span>
      );
  }
}

interface PayoutTrackingDialogProps {
  /** The withdrawal being tracked; null keeps the dialog closed. */
  payout: Payout | null;
  onClose: () => void;
}

/**
 * Per-withdrawal tracking (Deel-style): where the money is right now, as a
 * requested → sent → arrived timeline with the destination bank, the expected
 * arrival window, and a short reference for support conversations.
 */
export function PayoutTrackingDialog({
  payout,
  onClose,
}: PayoutTrackingDialogProps) {
  const account = usePayoutAccount();
  if (!payout) return null;

  const destination = account.data?.bankLast4 ? bankLabel(account.data) : null;
  const steps = payoutTimeline(payout);

  return (
    <Dialog.Root open onOpenChange={(next) => next || onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface shadow-pop focus:outline-none">
          <div className="flex items-center justify-between gap-2.5 border-b border-line px-4 py-3">
            <Dialog.Title className="text-card font-[650] text-ink">
              Withdrawal Details
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
          <Dialog.Description className="sr-only">
            Track the progress of this withdrawal.
          </Dialog.Description>

          <div className="flex items-start justify-between gap-3 border-b border-line p-4">
            <div className="min-w-0">
              <p className="text-stat font-bold tabular-nums text-ink">
                {formatMinor(payout.amountMinor)}
              </p>
              {destination && (
                <p className="mt-1 truncate text-sub text-ink-muted">
                  to {destination}
                </p>
              )}
            </div>
            <PayoutStatusBadge status={payout.status} />
          </div>

          <ol className="flex flex-col p-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepMarker state={step.state} />
                  {index < steps.length - 1 && (
                    <span
                      className={cn(
                        "my-1 w-[1.5px] flex-1",
                        step.state === "done" ? "bg-blue" : "bg-line",
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "min-w-0 pb-[18px]",
                    index === steps.length - 1 && "pb-0",
                  )}
                >
                  <p
                    className={cn(
                      "text-block font-[550]",
                      step.state === "failed" ? "text-bad" : "text-ink",
                      step.state === "upcoming" && "text-ink-muted",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-sub text-ink-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-meta text-ink-muted">
            <span>Reference</span>
            <span className="font-mono tabular-nums tracking-wide">
              {payoutReference(payout.id)}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
