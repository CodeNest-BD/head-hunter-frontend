"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { useMyCandidatesForJob } from "@/features/candidates";
import { InboxCandidatesTable } from "@/features/inbox";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/** The server's cap: five candidates per recruiter per job. */
const MAX_CANDIDATES = 5;

/**
 * Level 2 of the recruiter inbox: your candidates on one job, each with its own
 * conversation. Sending another is its own page — see ./submit.
 */
function JobCandidates({ jobId }: { jobId: string }) {
  const mine = useMyCandidatesForJob(jobId);
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
      <Plus className="h-4 w-4" />
      At the {MAX_CANDIDATES}-candidate limit
    </Button>
  ) : (
    <Button asChild type="button" disabled={mine.isPending}>
      <Link href={`/recruiter/inbox/job/${jobId}/submit`}>
        <Plus className="h-4 w-4" />
        {isEmpty ? "Submit a candidate" : "Submit another candidate"}
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <Link
          href="/recruiter/inbox"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            title="Your candidates"
            subtitle="Everyone you have sent to this job. Open one for its conversation."
            className="mb-0"
          />
          {!isEmpty && submitAction}
        </div>
      </div>

      <InboxCandidatesTable
        side="recruiter"
        jobId={jobId}
        emptyAction={isEmpty ? submitAction : undefined}
      />
    </div>
  );
}

export default function RecruiterInboxJobPage() {
  const params = useParams<{ jobId: string }>();

  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <JobCandidates jobId={params.jobId} />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
