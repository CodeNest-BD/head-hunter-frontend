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

const STATUS_STYLES: Record<PayoutStatus, string> = {
  pending: "bg-[#FBF3DF] text-[#7A5109]",
  processing: "bg-primary/15 text-primary",
  paid: "bg-[#E7F4EC] text-[#17734E]",
  failed: "bg-[#FBEAEA] text-[#9B3535]",
  canceled: "bg-muted text-muted-foreground",
};

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <StatusBadge
      label={PAYOUT_STATUS_LABELS[status]}
      className={STATUS_STYLES[status]}
    />
  );
}

const MARKER = "flex h-5 w-5 shrink-0 items-center justify-center rounded-full";

function StepMarker({ state }: { state: PayoutTimelineState }) {
  switch (state) {
    case "done":
      return (
        <span className={cn(MARKER, "bg-primary text-primary-foreground")}>
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      );
    case "current":
      return (
        <span className={cn(MARKER, "border-2 border-primary bg-card")}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        </span>
      );
    case "upcoming":
      return <span className={cn(MARKER, "border-2 border-border bg-card")} />;
    case "failed":
      return (
        <span className={cn(MARKER, "bg-[#9B3535] text-white")}>
          <X className="h-3 w-3" strokeWidth={3} />
        </span>
      );
    case "canceled":
      return (
        <span className={cn(MARKER, "bg-muted text-muted-foreground")}>
          <X className="h-3 w-3" strokeWidth={3} />
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card shadow-card-lg focus:outline-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <Dialog.Title className="text-sm font-semibold text-foreground">
              Withdrawal Details
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Track the progress of this withdrawal.
          </Dialog.Description>

          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-navy">
                {formatMinor(payout.amountMinor)}
              </p>
              {destination && (
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  to {destination}
                </p>
              )}
            </div>
            <PayoutStatusBadge status={payout.status} />
          </div>

          <ol className="flex flex-col px-5 py-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepMarker state={step.state} />
                  {index < steps.length - 1 && (
                    <span
                      className={cn(
                        "my-1 w-px flex-1",
                        step.state === "done" ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "min-w-0 pb-5",
                    index === steps.length - 1 && "pb-0",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      step.state === "failed" ? "text-[#9B3535]" : "text-navy",
                      step.state === "upcoming" && "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>Reference</span>
            <span className="font-mono tracking-wide">
              {payoutReference(payout.id)}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
