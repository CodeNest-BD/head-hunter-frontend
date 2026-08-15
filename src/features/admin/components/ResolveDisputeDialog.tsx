"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { toast } from "sonner";

import { formatMinor, majorInputToMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { useResolveDispute } from "../hooks/useAdmin";
import type { AdminDispute, DisputeOutcome } from "../schemas";

const OUTCOMES: Array<{
  value: DisputeOutcome;
  label: string;
  hint: string;
}> = [
  {
    value: "release",
    label: "Release to recruiter",
    hint: "Pay the full escrowed commission to the recruiter.",
  },
  {
    value: "refund",
    label: "Refund to company",
    hint: "Return the full escrowed commission to the company wallet.",
  },
  {
    value: "split",
    label: "Split",
    hint: "Pay part to the recruiter, refund the rest to the company.",
  },
];

/**
 * The admin's dispute decision: release / refund / split (with the recruiter
 * award amount) plus an internal note. Money moves on confirm, so the dialog
 * spells out exactly what each outcome does.
 */
export function ResolveDisputeDialog({
  dispute,
  trigger,
}: {
  dispute: AdminDispute;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<DisputeOutcome>("release");
  const [awardInput, setAwardInput] = useState("");
  const [note, setNote] = useState("");
  const resolve = useResolveDispute();

  const awardMinor = majorInputToMinor(awardInput);
  const splitValid =
    outcome !== "split" ||
    (awardMinor !== null &&
      awardMinor >= 0 &&
      awardMinor <= dispute.amountMinor);

  const submit = async (): Promise<void> => {
    try {
      await resolve.mutateAsync({
        disputeId: dispute.disputeId,
        input: {
          outcome,
          ...(outcome === "split" && awardMinor !== null
            ? { recruiterAwardMinor: awardMinor }
            : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });
      toast.success("Dispute resolved", {
        description:
          outcome === "refund"
            ? "The escrow was returned to the company wallet."
            : "The payout is being processed.",
      });
      setOpen(false);
    } catch {
      toast.error("Could not resolve the dispute", {
        description: "Please try again.",
      });
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-card-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="font-heading text-lg font-bold text-navy">
            Resolve dispute — {dispute.jobTitle}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {formatMinor(dispute.amountMinor)} is escrowed for{" "}
            {dispute.recruiterName}&apos;s placement at {dispute.companyName}.
            Reason given: “{dispute.reason}”
          </AlertDialog.Description>

          <div className="mt-4 flex flex-col gap-2" role="radiogroup">
            {OUTCOMES.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  outcome === option.value
                    ? "border-primary bg-accent/60"
                    : "border-border hover:bg-accent/30"
                }`}
              >
                <input
                  type="radio"
                  name="dispute-outcome"
                  value={option.value}
                  checked={outcome === option.value}
                  onChange={() => setOutcome(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-navy">
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {outcome === "split" && (
            <div className="mt-4 flex flex-col gap-1.5">
              <Label htmlFor="split-award">Recruiter share (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="split-award"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={awardInput}
                  onChange={(event) => setAwardInput(event.target.value)}
                  className="max-w-[160px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Between $0 and {formatMinor(dispute.amountMinor)}. The remainder
                returns to the company wallet.
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="resolution-note">Note (internal, optional)</Label>
            <Textarea
              id="resolution-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={2000}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="outline"
                disabled={resolve.isPending}
              >
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              disabled={!splitValid || resolve.isPending}
              onClick={() => void submit()}
            >
              {resolve.isPending ? "Resolving…" : "Confirm resolution"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
