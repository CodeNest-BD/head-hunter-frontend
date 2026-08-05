"use client";

import { useParams } from "next/navigation";
import { AlertCircle, FileText, UserRound } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { CandidateCard, useCandidates } from "@/features/candidates";
import {
  COMPANY_SETTABLE_STATUSES,
  SUBMISSION_STATUS_LABELS,
  recruiterDisplayName,
  useSubmission,
  useUpdateSubmissionStatus,
  type SubmissionStatus,
} from "@/features/submissions";
import { BrandGlow, Eyebrow, PageHeader } from "@/shared/ui-components/brand";
import { cn } from "@/shared/libs/shadCnConfig";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-primary/15 text-primary",
  under_review: "bg-amber-500/15 text-amber-300",
  advanced: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="h-40 w-full animate-pulse rounded-xl border border-border/70 bg-muted" />
  );
}

function ErrorCallout({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertCircle className="h-[18px] w-[18px] shrink-0" />
      {message}
    </div>
  );
}

function CandidateSection({ submissionId }: { submissionId: string }) {
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
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load candidates.
        </div>
        <button
          type="button"
          className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
        <BrandGlow variant="hero" />
        <div className="relative flex flex-col items-center gap-3">
          <Eyebrow>No candidates</Eyebrow>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="h-6 w-6" />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            No candidates yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This submission has no candidates on it yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          submissionId={submissionId}
        />
      ))}
    </div>
  );
}

function SubmissionHeader({ submissionId }: { submissionId: string }) {
  const { data, isPending, isError } = useSubmission(submissionId);
  const updateStatus = useUpdateSubmissionStatus(submissionId);

  if (isPending) {
    return <CardSkeleton />;
  }
  if (isError) {
    return <ErrorCallout message="Could not load this submission." />;
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Submitted by
            </p>
            <p className="font-heading text-base font-semibold text-foreground">
              {recruiterDisplayName(data.recruiter)}
            </p>
            {data.recruiter?.yearsExperience !== null &&
              data.recruiter !== null && (
                <p className="text-sm text-muted-foreground">
                  {data.recruiter.yearsExperience} years of recruiting
                  experience
                </p>
              )}
            <div className="mt-2">
              <StatusPill status={data.status} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="submission-status"
            className="text-xs font-medium text-muted-foreground"
          >
            Update status
          </label>
          <select
            id="submission-status"
            aria-label="Submission status"
            value={
              COMPANY_SETTABLE_STATUSES.includes(
                data.status as (typeof COMPANY_SETTABLE_STATUSES)[number],
              )
                ? data.status
                : ""
            }
            disabled={updateStatus.isPending || data.status === "withdrawn"}
            onChange={(event) =>
              updateStatus.mutate(event.target.value as SubmissionStatus)
            }
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* `withdrawn` is the recruiter's action, so it is not offered here. */}
            {data.status === "withdrawn" && <option value="">Withdrawn</option>}
            {COMPANY_SETTABLE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {SUBMISSION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data.note && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/50 p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Recruiter note
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {data.note}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SubmissionReviewPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <div className="flex max-w-2xl flex-col gap-6">
          <PageHeader
            eyebrow="Submission"
            title="Review submission"
            subtitle="The recruiter, their note, and every candidate on this submission."
          />

          <SubmissionHeader submissionId={params.id} />
          <CandidateSection submissionId={params.id} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
