"use client";

import { useParams, useRouter } from "next/navigation";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { CandidateForm } from "@/features/candidates";
import { useJob } from "@/features/jobs";
import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { inboxJobPath, submitCandidatePath } from "@/shared/utils/entityPaths";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The URL carries the job's serial, but the submit and upload endpoints take
 * only its UUID — so the job is read first and the form gets `job.id`.
 */
function SubmitCandidateForm({ jobRef }: { jobRef: string }) {
  const router = useRouter();
  const { data: job, isPending, isError, refetch } = useJob(jobRef);
  useCanonicalPath(job && submitCandidatePath(job));

  if (isPending) {
    return (
      <div className="h-72 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
    );
  }
  if (isError) {
    return (
      <ErrorRetryCallout
        message="Could not load this job."
        onRetry={() => void refetch()}
      />
    );
  }

  const listHref = inboxJobPath("recruiter", job);
  return (
    <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 shadow-e1">
      <CandidateForm
        jobId={job.id}
        onDone={() => router.push(listHref)}
        onCancel={() => router.push(listHref)}
      />
    </div>
  );
}

/**
 * Submitting a candidate is its own page rather than a panel above the list:
 * the form is long enough to scroll on its own, and stacking it over the
 * list's search bar and empty state left the reader looking at two unrelated
 * things at once.
 */
export default function SubmitCandidatePage() {
  const params = useParams<{ jobId: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <RequireApprovedRecruiter>
          <div className="flex w-full flex-col gap-4">
            <BackLink
              href={inboxJobPath("recruiter", { id: params.jobId })}
              className="mb-0"
            >
              Back to your candidates
            </BackLink>
            <PageHeader
              title="Submit a candidate"
              subtitle="They get their own conversation with the company as soon as you send them."
              className="mb-0"
            />
            <SubmitCandidateForm jobRef={params.jobId} />
          </div>
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
