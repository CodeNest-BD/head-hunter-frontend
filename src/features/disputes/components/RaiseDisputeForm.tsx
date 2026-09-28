"use client";

import { useState } from "react";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { FormSection } from "@/shared/ui-components/layout/FormSection";

import { useRaiseDispute } from "../hooks/useDisputes";
import {
  DISPUTE_SUBJECT_LABELS,
  DISPUTE_SUBJECTS_BY_PARTY,
  disputeSubjectSchema,
  type DisputeChannel,
  type DisputeSubject,
} from "../schemas";
import { DisputeProofField, proofFileError } from "./DisputeProofField";

const MIN_REASON = 10;

/**
 * Inline "open a dispute" form for a held placement. Freezes the escrow and
 * files a support ticket; on success it hands the new dispute id back so the
 * caller can navigate to it.
 */
export function RaiseDisputeForm({
  placementId,
  party,
  onCancel,
  onRaised,
}: {
  placementId: string;
  party: DisputeChannel;
  onCancel: () => void;
  onRaised: (disputeId: string) => void;
}) {
  const [subject, setSubject] = useState<DisputeSubject | null>(null);
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState<File[]>([]);
  const raise = useRaiseDispute();

  // The first unacceptable file speaks for the set — listing every rejection
  // at once would bury the one the user has to act on.
  const proofError = proof.map(proofFileError).find(Boolean) ?? null;

  const submit = (): void => {
    if (!subject) return;
    raise.mutate(
      { placementId, subject, reason: reason.trim(), proof },
      { onSuccess: (dispute) => onRaised(dispute.id) },
    );
  };

  const tooShort = reason.trim().length < MIN_REASON;

  return (
    // A card in its own right inside the panel: the section rail carries the
    // "what this does" copy, the fields sit beside it, and the actions sit
    // under the same hairline every form page uses.
    <div className="rounded-md border border-line bg-surface shadow-e1">
      <FormSection
        title="Open a Dispute"
        hint="This freezes the fee in escrow and sends the details to support. An admin will review both sides and decide."
      >
        {/* `.field` */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`dispute-subject-${placementId}`}>Subject</Label>
          <NativeSelect
            id={`dispute-subject-${placementId}`}
            value={subject ?? ""}
            onChange={(e) => {
              const parsed = disputeSubjectSchema.safeParse(e.target.value);
              setSubject(parsed.success ? parsed.data : null);
            }}
          >
            <option value="">Select a subject…</option>
            {DISPUTE_SUBJECTS_BY_PARTY[party].map((s) => (
              <option key={s} value={s}>
                {DISPUTE_SUBJECT_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What went wrong? Include dates and specifics."
          rows={4}
          maxLength={4000}
        />
        <DisputeProofField
          files={proof}
          onChange={setProof}
          error={proofError}
          disabled={raise.isPending}
        />
        {raise.isError ? (
          <p className="text-meta font-medium text-bad">
            {isApiError(raise.error)
              ? allMessages(raise.error)
              : "Could not open the dispute. Please try again."}
          </p>
        ) : null}
      </FormSection>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
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
          disabled={
            raise.isPending || !subject || tooShort || proofError !== null
          }
          onClick={submit}
        >
          {raise.isPending
            ? proof.length > 0
              ? "Uploading…"
              : "Opening…"
            : "Open Dispute"}
        </Button>
      </div>
    </div>
  );
}
