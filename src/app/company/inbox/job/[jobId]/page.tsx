"use client";

import { useParams } from "next/navigation";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { InboxCandidatesTable } from "@/features/inbox";
import { useJob } from "@/features/jobs";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The inbox drill-down, level 2: every candidate sent to this job, newest
 * first, each naming the recruiter who sent them. Static "job" segment, so it
 * can never collide with /company/inbox/[id] (one candidate's conversation).
 */
export default function CompanyInboxJobPage() {
  const params = useParams<{ jobId: string }>();
  const { data: job } = useJob(params.jobId);

  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <RequireApprovedCompany>
          <div className="flex flex-col gap-4">
            <BackLink href="/company/inbox" className="mb-0">
              Back to inbox
            </BackLink>
            <PageHeader
              title={job?.title ?? "Candidates"}
              subtitle="Everyone sent to this job, newest first. Open one for its conversation."
              className="mb-0"
            />
            <InboxCandidatesTable side="company" jobId={params.jobId} />
          </div>
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
