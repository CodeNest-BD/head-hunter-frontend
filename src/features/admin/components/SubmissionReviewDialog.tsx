"use client";

import { useState, type ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  CandidateAttachments,
  CandidateDetailPanel,
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_TONES,
  useApproveCandidate,
  useCandidate,
  useDeclineCandidate,
} from "@/features/candidates";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";

/** Mirrors the backend's `@MinLength(10)` so the refusal happens here, with
 * the cursor already in the box, rather than as a 400 after a round trip. */
const MIN_REASON = 10;

/**
 * The panel is open, or it is open and asking why — a union rather than two
 * booleans, so "declining with the reason box hidden" cannot be represented.
 */
type Mode = { kind: "reviewing" } | { kind: "declining"; reason: string };

export interface SubmissionReviewDialogProps {
  candidateId: string;
  /** Names the trigger for assistive tech, so it is never a bare "Review". */
  name: string;
  /**
   * The control that opens the panel. Composition rather than a `size` or
   * `prominent` flag: a table cell wants the quiet default, a banner wants a
   * primary button, and the dialog has no business knowing which it is in.
   *
   * A single element, not a `ReactNode`: `Dialog.Trigger asChild` clones its
   * child and throws on a string, a fragment or a list, so the narrower type
   * turns a crash into a compile error.
   */
  trigger?: ReactElement;
}

/**
 * Where an admin actually reads a submission before letting a company see it.
 *
 * Deliberately the whole record rather than a summary: the client asked for a
 * quality check, and quality is in the CV and the recruiter's pitch, not in a
 * name and a stage. It reuses the same `CandidateDetailPanel` the recruiter
 * and company see — an admin approving on a different rendering of the facts
 * than the two parties will read is how a reviewer approves something that
 * looks wrong to everyone else.
 */
export function SubmissionReviewDialog({
  candidateId,
  name,
  trigger,
}: SubmissionReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "reviewing" });
  const candidate = useCandidate(candidateId, open);
  const approve = useApproveCandidate();
  const decline = useDeclineCandidate();

  const busy = approve.isPending || decline.isPending;
  const reason = mode.kind === "declining" ? mode.reason : "";
  const reasonTooShort = reason.trim().length < MIN_REASON;

  const close = (next: boolean): void => {
    if (busy) return;
    setOpen(next);
    if (!next) setMode({ kind: "reviewing" });
  };

  const done = (): void => {
    setOpen(false);
    setMode({ kind: "reviewing" });
  };

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            aria-label={`Review ${name}'s submission`}
            onClick={(event) => event.stopPropagation()}
          >
            Review
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY} />
        <Dialog.Content
          onClick={(event) => event.stopPropagation()}
          className={`${DIALOG_PANEL} flex max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] flex-col`}
        >
          <div className="flex items-start gap-3 border-b border-line px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <Dialog.Title className={DIALOG_TITLE}>
                Review submission
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-meta text-ink-muted">
                The company sees this candidate only once you approve.
              </Dialog.Description>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-4">
            {candidate.isPending ? (
              <div className="flex items-center justify-center gap-2 py-16 text-ink-faint">
                <Loader2 className="size-[15px] animate-spin" />
                <span className="text-sub">Loading the submission…</span>
              </div>
            ) : candidate.isError ? (
              <div className="flex items-center gap-2 rounded-sm border border-bad-line bg-bad-bg px-3 py-2.5 text-sub text-bad">
                <AlertCircle className="size-3.5 shrink-0" />
                Could not load this submission.
              </div>
            ) : (
              <CandidateDetailPanel
                candidate={candidate.data}
                // An admin judging quality reads the whole record, contact
                // details included — see the panel's own note.
                viewerParty="admin"
                stageLabel={CANDIDATE_STATUS_LABELS[candidate.data.status]}
                stageTone={CANDIDATE_STATUS_TONES[candidate.data.status]}
                negotiation={
                  candidate.data.pitch ? (
                    <div className="rounded-sm border border-line bg-surface-sub px-3 py-2.5">
                      <p className="text-label font-[650] uppercase text-ink-muted">
                        Recruiter&rsquo;s Pitch
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sub leading-relaxed text-ink-body">
                        {candidate.data.pitch}
                      </p>
                    </div>
                  ) : null
                }
              />
            )}
            {/* The CV is the thing being checked, so it is never behind a
                second click: the attachment list presigns its own preview and
                download links. */}
            {candidate.data && (
              <div className="mt-3.5">
                <CandidateAttachments candidateId={candidateId} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5">
            {mode.kind === "declining" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="decline-reason">
                  Why are you sending this back?
                </Label>
                <Textarea
                  id="decline-reason"
                  rows={3}
                  autoFocus
                  placeholder="The CV is for a different role — please attach the right one."
                  value={mode.reason}
                  onChange={(event) =>
                    setMode({ kind: "declining", reason: event.target.value })
                  }
                />
                <p className="text-meta text-ink-muted">
                  The recruiter sees this, so say what to fix. The company is
                  never told the submission was made.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {mode.kind === "reviewing" ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy || !candidate.data}
                    onClick={() => setMode({ kind: "declining", reason: "" })}
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    disabled={busy || !candidate.data}
                    onClick={() =>
                      approve.mutate(candidateId, { onSuccess: done })
                    }
                  >
                    {approve.isPending ? "Approving…" : "Approve"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setMode({ kind: "reviewing" })}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy || reasonTooShort}
                    onClick={() =>
                      decline.mutate(
                        { id: candidateId, reason: reason.trim() },
                        { onSuccess: done },
                      )
                    }
                  >
                    {decline.isPending ? "Sending back…" : "Send back"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
