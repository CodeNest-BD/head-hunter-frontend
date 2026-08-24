"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { CandidateForm, useMyCandidatesForJob } from "@/features/candidates";
import { InboxCandidatesTable } from "@/features/inbox";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/** The server's cap: five candidates per recruiter per job. */
const MAX_CANDIDATES = 5;

/**
 * Level 2 of the recruiter inbox: your candidates on one job, each with its own
 * conversation — plus the form to send another, which is the only place that
 * act happens now that opening a submission is gone.
 */
function JobCandidates({ jobId }: { jobId: string }) {
  const [adding, setAdding] = useState(false);
  const mine = useMyCandidatesForJob(jobId);
  const count = mine.data?.length ?? 0;
  const atCap = count >= MAX_CANDIDATES;
  // With nobody on this job yet the only thing to do is add someone, so the
  // action moves into the empty state rather than sitting in the corner above
  // an empty card. Once there is a list to act on, the header button returns.
  const isEmpty = !mine.isPending && count === 0;

  const submitButton = (
    <Button
      type="button"
      disabled={atCap || mine.isPending}
      onClick={() => setAdding(true)}
    >
      <Plus className="h-4 w-4" />
      {atCap
        ? `At the ${MAX_CANDIDATES}-candidate limit`
        : isEmpty
          ? "Submit a candidate"
          : "Submit another candidate"}
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
          {!adding && !isEmpty && submitButton}
        </div>
      </div>

      {adding && (
        <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm">
          <CandidateForm
            jobId={jobId}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <InboxCandidatesTable
        side="recruiter"
        jobId={jobId}
        emptyAction={!adding && isEmpty ? submitButton : undefined}
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
