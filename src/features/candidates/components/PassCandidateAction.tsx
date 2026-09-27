"use client";

import { useState } from "react";

import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";

import { usePassCandidate } from "../hooks/useCandidates";

/** Passing outside an interview outcome — for a candidate who stops fitting
 * while an offer is still being negotiated, or before any interview. */
export function PassCandidateAction({ candidateId }: { candidateId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const passCandidate = usePassCandidate(candidateId);

  if (isConfirming) {
    return (
      <ConfirmAction
        message="Pass on this candidate? Any offer awaiting a response is withdrawn, and the conversation closes."
        confirmLabel="Confirm pass"
        busyLabel="Passing…"
        busy={passCandidate.isPending}
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => passCandidate.mutate()}
      />
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setIsConfirming(true)}
    >
      Pass
    </Button>
  );
}
