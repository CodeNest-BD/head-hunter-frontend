"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { useMyCandidatesForJob } from "@/features/candidates";
import { SubmissionsTable } from "@/features/inbox";
import { useJob } from "@/features/jobs";
import type { Job } from "@/features/jobs/schemas";
import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { inboxJobPath, submitCandidatePath } from "@/shared/utils/entityPaths";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/** The server's cap: five candidates per recruiter per job. */
const MAX_CANDIDATES = 5;

/**
 * Level 2 of the recruiter inbox: your candidates on one job, each with its own
 * conversation. Sending another is its own page — see ./submit.
 */
function JobCandidates({ job }: { job: Job }) {
  const mine = useMyCandidatesForJob(job.id);
  const count = mine.data?.length ?? 0;
  const atCap = count >= MAX_CANDIDATES;
  // With nobody on this job yet the only thing to do is add someone, so the
  // action moves into the empty state rather than sitting in the corner above
  // an empty card. Once there is a list to act on, the header button returns.
  const isEmpty = !mine.isPending && count === 0;

  // A disabled anchor is not a thing, so the capped state is a plain disabled
  // button that says why rather than a link that goes nowhere.
  const submitAction = atCap ? (
    <Button type="button" disabled>
      <Plus aria-hidden="true" />
      At the {MAX_CANDIDATES}-candidate limit
    </Button>
  ) : (
    <Button asChild type="button" disabled={mine.isPending}>
      <Link href={submitCandidatePath(job)}>
        <Plus aria-hidden="true" />
        {isEmpty ? "Submit a candidate" : "Submit another candidate"}
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Your candidates"
          subtitle="Everyone you have sent to this job. Open one for its conversation."
          className="mb-0"
        />
        {!isEmpty && submitAction}
      </div>

      <SubmissionsTable
        jobId={job.id}
        emptyAction={isEmpty ? submitAction : undefined}
      />
    </div>
  );
}

/**
 * The recruiter inbox's conversation list filters by the job's UUID, so the
 * URL's ref is resolved to the job first.
 */
function JobCandidatesByRef({ jobRef }: { jobRef: string }) {
  const { data: job, isPending, isError, refetch } = useJob(jobRef);
  useCanonicalPath(job && inboxJobPath("recruiter", job));

  if (isPending) return <TableSkeleton />;
  if (isError) {
    return (
      <ErrorRetryCallout
        message="Could not load this job."
        onRetry={() => void refetch()}
      />
    );
  }
  return <JobCandidates job={job} />;
}

export default function RecruiterInboxJobPage() {
  const params = useParams<{ jobId: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <JobCandidatesByRef jobRef={params.jobId} />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
