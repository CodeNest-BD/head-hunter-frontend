"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Checkbox } from "@/shared/ui-components/controls/checkbox";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL_PADDED,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";

import { useResolveDispute } from "../hooks/useDisputes";
import {
  DISPUTE_STATUS_LABELS,
  FINAL_RESOLUTIONS,
  NOTE_REQUIRED_RESOLUTIONS,
  isDisputeOpen,
  type AdminDisputeDetail,
  type DisputeResolution,
} from "../schemas";

const SUCCESS_TOAST: Record<DisputeResolution, string> = {
  release: "Payment released to the recruiter.",
  refund: "Commission refunded to the company.",
  resume: "Countdown resumed; the fee stays held.",
  close: "Dispute closed.",
};

/** Mirrors the backend's `RESOLUTION_NOTE_MIN_LENGTH`. */
const MIN_NOTE = 20;

/** `.choice` — a full-width outcome block with its consequence underneath. */
const CHOICE =
  "flex w-full items-center gap-3 rounded-md border border-line-strong bg-surface p-3.5 text-left transition-colors hover:border-blue hover:shadow-e2";

/**
 * How an admin settles a dispute. The two money moves lead, because they are
 * what the case is for; the two that leave the fee alone sit quietly beneath
 * them.
 *
 * Nothing here can change the case's status or its owner — the API has no
 * route for either — so the status is reported rather than offered as a
 * control that would not work.
 */
export function ResolveDisputeCard({
  dispute,
}: {
  dispute: AdminDisputeDetail;
}) {
  const resolve = useResolveDispute(dispute.id);
  const [note, setNote] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [confirming, setConfirming] = useState<DisputeResolution | null>(null);
  const open = isDisputeOpen(dispute.status);

  const fee = formatMinor(dispute.amountMinor);
  const payoutDate = formatDate(dispute.holdExpiresAt);

  const decisions: {
    outcome: DisputeResolution;
    title: string;
    note: string;
  }[] = [
    {
      outcome: "release",
      title: `Release ${fee} to recruiter`,
      note: `Pays on ${payoutDate} if resolved before then`,
    },
    {
      outcome: "refund",
      title: `Refund ${fee} to company`,
      note: "Commission is cancelled",
    },
  ];

  const isFinal = confirming !== null && FINAL_RESOLUTIONS.includes(confirming);
  const noteRequired =
    confirming !== null && NOTE_REQUIRED_RESOLUTIONS.includes(confirming);
  const noteMissing = noteRequired && note.trim().length < MIN_NOTE;
  const blocked = noteMissing || (isFinal && !reviewed);

  const close = (): void => {
    setConfirming(null);
    setReviewed(false);
  };

  const doResolve = (outcome: DisputeResolution): void => {
    resolve.mutate(
      { outcome, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(SUCCESS_TOAST[outcome]);
          setNote("");
          close();
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
    <section className="rounded-md bg-surface shadow-e1">
      <div className="px-5 py-4">
        <h2 className="m-0 mb-3 text-card font-[650] text-ink">
          Resolve dispute
        </h2>
        <div className="flex items-center justify-between gap-3 text-sub">
          <span className="text-ink-muted">Case status</span>
          <StatusBadge
            label={DISPUTE_STATUS_LABELS[dispute.status] ?? dispute.status}
            tone={open ? "info" : "neutral"}
          />
        </div>
      </div>

      <div className="border-t border-line px-5 py-4">
        <h3 className="mb-2.5 mt-0 text-sub font-[650] text-ink">
          Financial decision
        </h3>
        {!open ? (
          <p className="m-0 text-sub text-ink-muted">
            This dispute is settled. {dispute.resolutionNote ? "" : "No "}
            further decisions can be made.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {decisions.map((decision) => (
                <button
                  key={decision.outcome}
                  type="button"
                  onClick={() => setConfirming(decision.outcome)}
                  className={CHOICE}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sub font-[650] text-ink">
                      {decision.title}
                    </span>
                    <span className="block text-meta text-ink-muted">
                      {decision.note}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-ink-faint"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-x-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirming("resume")}
              >
                Continue hold
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirming("close")}
              >
                Close without moving money
              </Button>
            </div>

            <p className="mb-0 mt-2 text-center text-meta leading-[18px] text-ink-muted">
              Final decisions need a resolution note and can be made once.
            </p>
          </>
        )}
      </div>

      <AlertDialog.Root
        open={confirming !== null}
        onOpenChange={(next) => !next && close()}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={DIALOG_OVERLAY} />
          <AlertDialog.Content className={cn(DIALOG_PANEL_PADDED, "max-w-lg")}>
            {confirming && (
              <ConfirmBody
                dispute={dispute}
                outcome={confirming}
                fee={fee}
                payoutDate={payoutDate}
                isFinal={isFinal}
                note={note}
                onNote={setNote}
                noteRequired={noteRequired}
                noteMissing={noteMissing}
                reviewed={reviewed}
                onReviewed={setReviewed}
                blocked={blocked}
                pending={resolve.isPending}
                onConfirm={() => doResolve(confirming)}
              />
            )}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}

function ConfirmBody({
  dispute,
  outcome,
  fee,
  payoutDate,
  isFinal,
  note,
  onNote,
  noteRequired,
  noteMissing,
  reviewed,
  onReviewed,
  blocked,
  pending,
  onConfirm,
}: {
  dispute: AdminDisputeDetail;
  outcome: DisputeResolution;
  fee: string;
  payoutDate: string;
  isFinal: boolean;
  note: string;
  onNote: (next: string) => void;
  noteRequired: boolean;
  noteMissing: boolean;
  reviewed: boolean;
  onReviewed: (next: boolean) => void;
  blocked: boolean;
  pending: boolean;
  onConfirm: () => void;
}) {
  const copy: Record<
    DisputeResolution,
    {
      title: string;
      lead: string;
      action: string;
      when: string;
      confirm: string;
    }
  > = {
    release: {
      title: "Release recruiter payment",
      lead: `Resolve this dispute in the recruiter’s favour and authorise the payout.`,
      action: "Remove the dispute hold, then transfer to the recruiter.",
      // The guarantee clock never moved, so resolving early does not pay early.
      when: `${payoutDate}, the original eligibility date. Resolving before day 30 doesn’t pay early.`,
      confirm: `Release ${fee}`,
    },
    refund: {
      title: "Refund the company",
      lead: "Resolve this dispute in the company’s favour and cancel the commission.",
      action: "Return the held fee to the company’s wallet.",
      when: "Immediately once confirmed.",
      confirm: `Refund ${fee}`,
    },
    resume: {
      title: "Continue the hold",
      lead: "Keep the fee held and resume the release countdown where it paused.",
      action: `${fee} stays in escrow; the clock restarts.`,
      when: "The release date moves out by the time this dispute was open.",
      confirm: "Resume countdown",
    },
    close: {
      title: "Close without moving money",
      lead: "Close the case without a financial decision.",
      action: `${fee} stays held; any settlement is done by hand.`,
      when: "Immediately once confirmed.",
      confirm: "Close dispute",
    },
  };
  const c = copy[outcome];

  return (
    <>
      <p className="m-0 text-meta text-ink-muted">
        {dispute.serialNumber ? `DSP-${dispute.serialNumber} · ` : ""}
        {isFinal ? "Final financial decision" : "Case decision"}
      </p>
      <AlertDialog.Title className={cn(DIALOG_TITLE, "mt-0.5")}>
        {c.title}
      </AlertDialog.Title>
      <AlertDialog.Description className="mt-1.5 text-sub text-ink-muted">
        {c.lead}
      </AlertDialog.Description>

      <dl className="m-0 mt-4 flex flex-col gap-2.5 border-t border-line pt-4 text-sub">
        {[
          ["Amount", fee],
          ["Company", dispute.companyName],
          ["Recruiter", dispute.recruiterName],
          ["Candidate", `${dispute.candidateName} · ${dispute.jobTitle}`],
          ["Action", c.action],
          ["When", c.when],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="shrink-0 text-ink-muted">{label}</dt>
            <dd className="m-0 text-right text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {isFinal && (
        <p className="mb-0 mt-3 text-meta font-medium text-warn">
          This is final. The opposite action is locked afterwards.
        </p>
      )}

      <label className="mt-4 block">
        <span className="text-sub font-medium text-ink">
          Resolution note
          {noteRequired && <span className="text-bad"> *</span>}
          <span className="font-normal text-ink-muted">
            {" "}
            · shared with both parties
          </span>
        </span>
        <Textarea
          className="mt-1.5"
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder="What did you find, and which guarantee terms applied?"
          rows={3}
          maxLength={4000}
        />
      </label>
      {noteMissing && (
        <p className="mb-0 mt-1 text-meta text-ink-muted">
          At least {MIN_NOTE} characters.
        </p>
      )}

      {isFinal && (
        <label className="mt-3 flex items-start gap-2.5 text-sub text-ink">
          <Checkbox
            checked={reviewed}
            onCheckedChange={(checked) => onReviewed(checked === true)}
          />
          I’ve reviewed the original conversation, both private threads and the
          evidence.
        </label>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <AlertDialog.Cancel asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Cancel
          </Button>
        </AlertDialog.Cancel>
        <Button
          type="button"
          variant={outcome === "refund" ? "destructive" : "default"}
          disabled={pending || blocked}
          onClick={onConfirm}
        >
          {pending ? "Working…" : c.confirm}
        </Button>
      </div>
    </>
  );
}
