"use client";

import { useState, type ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Loader2, X } from "lucide-react";

import { useCandidate } from "@/features/candidates";
import { Button } from "@/shared/ui-components/controls/button";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";
import { SubmissionDecision, SubmissionRecord } from "./SubmissionReview";

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
 * Reviewing a submission from the submissions table, where the row is the only
 * thing on screen and a panel over it is the shortest way to the record.
 *
 * The conversation page renders the same two pieces inline instead: that page
 * is mostly empty, and covering empty space with a modal buys nothing.
 */
export function SubmissionReviewDialog({
  candidateId,
  name,
  trigger,
}: SubmissionReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const candidate = useCandidate(candidateId, open);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
            {/* Escape and the overlay already close this, but neither is
                visible: a panel with no way out that you can see reads as a
                trap. */}
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-1.5 -mt-0.5 size-8 shrink-0"
                aria-label="Close"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </Dialog.Close>
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
              /* The panel renders the CV itself — this used to add a second
                 `CandidateAttachments` under it, which listed every file
                 twice. */
              <SubmissionRecord candidate={candidate.data} />
            )}
          </div>

          <div className="border-t border-line px-5 py-3.5">
            <SubmissionDecision
              candidateId={candidateId}
              disabled={!candidate.data}
              onDone={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
