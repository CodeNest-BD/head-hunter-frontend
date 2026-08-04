"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

function CandidateSection({ submissionId }: { submissionId: string }) {
  const { data, isPending, isError, refetch } = useCandidates(submissionId);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading candidates…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load candidates.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </p>
    );
  }
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This submission has no candidates on it yet.
      </p>
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
    return <p className="text-sm text-muted-foreground">Loading submission…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load this submission.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Submitted by</p>
          <p className="font-medium">{recruiterDisplayName(data.recruiter)}</p>
          {data.recruiter?.yearsExperience !== null &&
            data.recruiter !== null && (
              <p className="text-sm text-muted-foreground">
                {data.recruiter.yearsExperience} years of recruiting experience
              </p>
            )}
          <p className="mt-2 text-sm text-muted-foreground">Status</p>
          <p className="font-medium">{SUBMISSION_STATUS_LABELS[data.status]}</p>
        </div>
        <select
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
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
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

      {data.note && (
        <div>
          <p className="text-sm text-muted-foreground">Recruiter note</p>
          <p className="whitespace-pre-wrap text-sm">{data.note}</p>
        </div>
      )}
    </div>
  );
}

export default function SubmissionReviewPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/company/inbox"
            className="text-sm text-muted-foreground underline"
          >
            Back to inbox
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Review submission
          </h1>
        </div>

        <SubmissionHeader submissionId={params.id} />
        <CandidateSection submissionId={params.id} />
      </main>
    </RequireRole>
  );
}
