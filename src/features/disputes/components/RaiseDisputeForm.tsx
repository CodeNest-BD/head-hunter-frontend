"use client";

import { useState } from "react";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { Textarea } from "@/shared/ui-components/controls/textarea";

import { useRaiseDispute } from "../hooks/useDisputes";

const MIN_REASON = 10;

/**
 * Inline "open a dispute" form for a held placement. Freezes the escrow and
 * files a support ticket; on success it hands the new dispute id back so the
 * caller can navigate to it.
 */
export function RaiseDisputeForm({
  placementId,
  onCancel,
  onRaised,
}: {
  placementId: string;
  onCancel: () => void;
  onRaised: (disputeId: string) => void;
}) {
  const [reason, setReason] = useState("");
  const raise = useRaiseDispute();

  const submit = (): void => {
    raise.mutate(
      { placementId, reason: reason.trim() },
      { onSuccess: (dispute) => onRaised(dispute.id) },
    );
  };

  const tooShort = reason.trim().length < MIN_REASON;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/30 p-4">
      <div>
        <p className="text-sm font-semibold text-navy">Open a Dispute</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          This freezes the fee in escrow and sends the details to support. An
          admin will review both sides and decide.
        </p>
      </div>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What went wrong? Include dates and specifics."
        rows={4}
        maxLength={4000}
      />
      {raise.isError ? (
        <p className="text-xs text-destructive">
          {isApiError(raise.error)
            ? allMessages(raise.error)
            : "Could not open the dispute. Please try again."}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={raise.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={raise.isPending || tooShort}
          onClick={submit}
        >
          {raise.isPending ? "Opening…" : "Open Dispute"}
        </Button>
      </div>
    </div>
  );
}
