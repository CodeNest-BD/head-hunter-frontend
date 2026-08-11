"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Plus, UserRound } from "lucide-react";

import {
  CANDIDATE_STATUS_LABELS,
  CandidateAttachments,
  CandidateFields,
  CandidateForm,
  useCandidates,
  useDeleteCandidate,
  type Candidate,
  type CandidateStatus,
} from "@/features/candidates";
import { Thread } from "@/features/conversations";
import { useJob } from "@/features/jobs";
import {
  SubmissionHeader,
  useSubmission,
  type Submission,
  type SubmissionStatus,
} from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { RequireRole } from "@/features/auth";

const MAX_CANDIDATES = 5;

const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  reviewing: "text-[#92610C] bg-[#FBF3DF]",
  interviewing: "text-[#92610C] bg-[#FBF3DF]",
  offered: "text-[#17734E] bg-[#E7F4EC]",
  hired: "text-[#17734E] bg-[#E7F4EC]",
  passed: "bg-muted text-muted-foreground",
};

function CardSkeleton() {
  return (
    <div className="h-40 w-full animate-pulse rounded-xl border border-border/70 bg-muted" />
  );
}

function ErrorCallout({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-[18px] w-[18px] shrink-0" />
        {message}
      </div>
      {onRetry && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onRetry()}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

function CandidateItem({
  candidate,
  submissionId,
}: {
  candidate: Candidate;
  submissionId: string;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-remove">("view");
  const deleteCandidate = useDeleteCandidate(submissionId);

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <CandidateForm
          submissionId={submissionId}
          candidate={candidate}
          onDone={() => setMode("view")}
        />
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMode("view")}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            {candidate.fullName}
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href={`mailto:${candidate.email}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {candidate.email}
            </a>
            {candidate.phone ? ` · ${candidate.phone}` : ""}
          </p>
        </div>
        <StatusBadge
          label={CANDIDATE_STATUS_LABELS[candidate.status]}
          className={CANDIDATE_STATUS_STYLES[candidate.status]}
        />
      </div>

      <CandidateFields candidate={candidate} />

      <CandidateAttachments candidateId={candidate.id} />

      <div className="border-t border-border/60 pt-3">
        {mode === "confirm-remove" ? (
          <ConfirmAction
            message="Remove this candidate? This cannot be undone."
            confirmLabel="Confirm remove"
            busyLabel="Removing…"
            busy={deleteCandidate.isPending}
            onCancel={() => setMode("view")}
            onConfirm={() => deleteCandidate.mutate(candidate.id)}
          />
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMode("edit")}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("confirm-remove")}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCandidateSection({
  submissionId,
  candidateCount,
  submissionStatus,
}: {
  submissionId: string;
  candidateCount: number;
  submissionStatus: SubmissionStatus;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const submissionClosed =
    submissionStatus === "withdrawn" || submissionStatus === "rejected";
  const atCapacity = candidateCount >= MAX_CANDIDATES;
  const disabled = submissionClosed || atCapacity;
  const disabledReason = submissionClosed
    ? "This submission is no longer open for new candidates."
    : atCapacity
      ? `A submission may hold at most ${MAX_CANDIDATES} candidates.`
      : undefined;

  if (isAdding) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <CandidateForm
          submissionId={submissionId}
          onDone={() => setIsAdding(false)}
        />
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        disabled={disabled}
        title={disabledReason}
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-[18px] w-[18px]" />
        Add candidate
      </Button>
    </div>
  );
}

function CandidateSection({
  submissionId,
  submissionStatus,
}: {
  submissionId: string;
  submissionStatus: SubmissionStatus;
}) {
  const { data, isPending, isError, refetch } = useCandidates(submissionId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorCallout
        message="Could not load candidates."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Candidates ({data.length}/{MAX_CANDIDATES})
      </h2>

      {data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#C9D2E3] bg-card px-6 py-12 text-center shadow-card">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="h-6 w-6" />
            </span>
            <p className="font-heading text-base font-semibold text-foreground">
              No candidates yet
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first candidate below to get this submission moving.
            </p>
          </div>
        </div>
      )}

      {data.map((candidate) => (
        <CandidateItem
          key={candidate.id}
          candidate={candidate}
          submissionId={submissionId}
        />
      ))}

      <AddCandidateSection
        submissionId={submissionId}
        candidateCount={data.length}
        submissionStatus={submissionStatus}
      />
    </div>
  );
}

/** Only mounts once the submission has loaded, so it is safe to call
 * `useJob` unconditionally here. */
function SubmissionDetailBody({ submission }: { submission: Submission }) {
  const job = useJob(submission.jobId);
  const jobTitle = job.data?.title ?? (job.isPending ? "Loading…" : "—");

  return (
    <div className="flex flex-col gap-6">
      <SubmissionHeader submission={submission} jobTitle={jobTitle} />
      <CandidateSection
        submissionId={submission.id}
        submissionStatus={submission.status}
      />
      <Thread submissionId={submission.id} />
    </div>
  );
}

function SubmissionDetailContent({ submissionId }: { submissionId: string }) {
  const {
    data: submission,
    isPending,
    isError,
    refetch,
  } = useSubmission(submissionId);

  if (isPending) {
    return <CardSkeleton />;
  }
  if (isError) {
    return (
      <ErrorCallout
        message="Could not load this submission."
        onRetry={() => void refetch()}
      />
    );
  }

  return <SubmissionDetailBody submission={submission} />;
}

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-3xl flex-col gap-6">
          <Link
            href="/recruiter/submissions"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to submissions
          </Link>
          <PageHeader
            eyebrow="Submission"
            title="Submission detail"
            subtitle="Track your candidates and the job you submitted them to."
            className="mb-0"
          />
          <SubmissionDetailContent submissionId={params.id} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
