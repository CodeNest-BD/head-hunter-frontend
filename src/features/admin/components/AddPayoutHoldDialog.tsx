"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL_PADDED,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";
import { useAddPayoutHold } from "../hooks/useAdmin";
import { HOLD_REASON_LABELS } from "./financeLabels";
import { PAYOUT_HOLD_REASONS, type PayoutHoldReason } from "../schemas";

/** Enough that the next admin to read it can tell what was being checked. */
const MIN_NOTE = 10;

function toReason(value: string): PayoutHoldReason {
  return PAYOUT_HOLD_REASONS.find((reason) => reason === value) ?? "other";
}

/**
 * Places a manual hold. The note is required and shown verbatim wherever the
 * hold appears — a hold with no stated reason is one nobody else can safely
 * lift, and this one stops money that is otherwise due.
 */
export function AddPayoutHoldDialog({
  payoutRef,
  open,
  onOpenChange,
}: {
  payoutRef: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState<PayoutHoldReason>("account_review");
  const [note, setNote] = useState("");
  const add = useAddPayoutHold(payoutRef);
  const ready = note.trim().length >= MIN_NOTE;

  const close = (): void => {
    setNote("");
    setReason("account_review");
    onOpenChange(false);
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (add.isPending) return;
        if (!next) close();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={DIALOG_OVERLAY} />
        <AlertDialog.Content className={cn(DIALOG_PANEL_PADDED, "max-w-lg")}>
          <AlertDialog.Title className={DIALOG_TITLE}>
            Hold this commission
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-sub text-ink-muted">
            It will not release on day 30, and will not release at all until
            every hold on it is lifted.
          </AlertDialog.Description>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hold-reason">Reason</Label>
              <NativeSelect
                id="hold-reason"
                value={reason}
                onChange={(event) => setReason(toReason(event.target.value))}
              >
                {PAYOUT_HOLD_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {HOLD_REASON_LABELS[option]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hold-note">What is being checked</Label>
              <Textarea
                id="hold-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Recruiter account suspended pending review."
              />
              <p className="m-0 text-meta text-ink-muted">
                {ready
                  ? "Shown on the payout and in its timeline."
                  : `At least ${MIN_NOTE} characters — the next admin has only this to go on.`}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={add.isPending}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              disabled={!ready || add.isPending}
              onClick={() =>
                add.mutate({ reason, note: note.trim() }, { onSuccess: close })
              }
            >
              {add.isPending ? "Placing…" : "Place hold"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
