"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { toast } from "sonner";

import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { useRaiseDispute } from "../hooks/usePlacements";

const MIN_REASON = 10;
const MAX_REASON = 2000;

/**
 * Confirmation + reason for contesting a placement. Disputing freezes the
 * escrow until an admin resolves it, so it always confirms with context.
 */
export function DisputeDialog({
  placementId,
  candidateName,
  trigger,
}: {
  placementId: string;
  candidateName: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const dispute = useRaiseDispute();
  const trimmed = reason.trim();
  const valid = trimmed.length >= MIN_REASON && trimmed.length <= MAX_REASON;

  const submit = async (): Promise<void> => {
    try {
      await dispute.mutateAsync({ placementId, reason: reason.trim() });
      toast.success("Dispute opened", {
        description:
          "The escrow is frozen until an administrator reviews your dispute.",
      });
      setOpen(false);
      setReason("");
    } catch {
      toast.error("Could not open the dispute", {
        description: "Please try again.",
      });
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-card-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="font-heading text-lg font-bold text-navy">
            Dispute the placement of {candidateName}?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            The commission stays frozen in escrow — it will not be released to
            the recruiter — until an administrator resolves the dispute.
          </AlertDialog.Description>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor={`dispute-reason-${placementId}`}>Reason</Label>
            <Textarea
              id={`dispute-reason-${placementId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={MAX_REASON}
              placeholder="e.g. The candidate resigned within the first week."
            />
            <p className="text-xs text-muted-foreground">
              At least {MIN_REASON} characters.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="outline"
                disabled={dispute.isPending}
              >
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!valid || dispute.isPending}
              onClick={() => void submit()}
            >
              {dispute.isPending ? "Opening…" : "Open dispute"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
