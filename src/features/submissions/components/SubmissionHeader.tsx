"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { useUpdateSubmissionStatus } from "../hooks/useSubmissions";
import {
  SUBMISSION_STATUS_LABELS,
  type Submission,
  type SubmissionStatus,
} from "../schemas";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "text-[#92610C] bg-[#FBF3DF]",
  advanced: "text-[#17734E] bg-[#E7F4EC]",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

interface SubmissionHeaderProps {
  submission: Submission;
  jobTitle: string;
}

/**
 * The job, its status, the recruiter's note, and — while the submission is
 * still live — a Withdraw action gated behind an inline confirmation, since
 * withdrawing cannot be undone.
 */
export function SubmissionHeader({
  submission,
  jobTitle,
}: SubmissionHeaderProps) {
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const updateStatus = useUpdateSubmissionStatus(submission.id);

  const canWithdraw =
    submission.status !== "withdrawn" && submission.status !== "rejected";

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Submitted to
          </p>
          <Link
            href={`/jobs/${submission.jobId}`}
            className="font-heading text-base font-semibold text-foreground transition-colors hover:text-primary"
          >
            {jobTitle}
          </Link>
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_STYLES[submission.status],
            )}
          >
            {SUBMISSION_STATUS_LABELS[submission.status]}
          </span>
        </div>

        {canWithdraw &&
          (confirmingWithdraw ? (
            <div className="flex flex-col items-end gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">
                Withdraw this submission? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingWithdraw(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate("withdrawn")}
                >
                  {updateStatus.isPending ? "Withdrawing…" : "Confirm withdraw"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmingWithdraw(true)}
            >
              Withdraw
            </Button>
          ))}
      </div>

      {submission.note && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/50 p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Your note
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {submission.note}
          </p>
        </div>
      )}
    </div>
  );
}
