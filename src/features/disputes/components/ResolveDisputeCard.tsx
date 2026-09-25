"use client";

import { useState } from "react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Textarea } from "@/shared/ui-components/controls/textarea";

import { useResolveDispute } from "../hooks/useDisputes";
import {
  DISPUTE_SUBJECT_LABELS,
  type AdminDisputeDetail,
  type DisputeResolution,
} from "../schemas";

const SUCCESS_TOAST: Record<DisputeResolution, string> = {
  resume: "Countdown resumed.",
  close: "Dispute closed.",
};

const CONFIRM_LABEL: Record<DisputeResolution, string> = {
  resume: "Resume Countdown",
  close: "Close Dispute",
};

/**
 * How the admin closes a dispute: resume the countdown, or close it and settle
 * any money by hand. Leads with who owns it — which side raised it and about
 * what — so the decision is read against the claim being made.
 */
export function ResolveDisputeCard({
  dispute,
}: {
  dispute: AdminDisputeDetail;
}) {
  const resolve = useResolveDispute(dispute.id);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<DisputeResolution | null>(null);

  const fee = formatMinor(dispute.amountMinor);
  const raisedByName =
    dispute.raisedBy === "company"
      ? dispute.companyName
      : dispute.recruiterName;

  const confirmMessage: Record<DisputeResolution, string> = {
    resume: `Keep ${fee} in escrow and resume the release countdown? The release date moves out by the time this dispute was open.`,
    close: `Close this dispute without resuming the countdown? The ${fee} stays held — any refund or payout is done by hand.`,
  };

  const doResolve = (outcome: DisputeResolution): void => {
    resolve.mutate(
      { outcome, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(SUCCESS_TOAST[outcome]);
          setConfirming(null);
        },
        onError: (error) =>
          toast.error(
            isApiError(error)
              ? allMessages(error)
              : "Could not resolve the dispute.",
          ),
      },
    );
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-heading text-base font-bold text-navy">
            Resolve
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Raised by the {dispute.raisedBy} —{" "}
            <span className="font-semibold text-navy">{raisedByName}</span> ·{" "}
            {DISPUTE_SUBJECT_LABELS[dispute.subject]}. Resume the release
            countdown, or close the dispute and settle the {fee} by hand.
          </p>
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Resolution note (recorded on the dispute)…"
          rows={2}
          maxLength={4000}
        />
        {confirming ? (
          <ConfirmAction
            message={confirmMessage[confirming]}
            confirmLabel={CONFIRM_LABEL[confirming]}
            busyLabel="Resolving…"
            busy={resolve.isPending}
            onConfirm={() => doResolve(confirming)}
            onCancel={() => setConfirming(null)}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setConfirming("resume")}>
              Resume Countdown
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming("close")}
            >
              Close Dispute
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
