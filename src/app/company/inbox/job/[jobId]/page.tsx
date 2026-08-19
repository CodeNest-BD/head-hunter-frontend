"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { useJob } from "@/features/jobs";
import { InboxRecruitersTable } from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The inbox drill-down, level 2: recruiters who submitted to this job,
 * best-reviewed first. Static "job" segment, so it can never collide with
 * /company/inbox/[id] (the conversation, which stays as it was).
 */
export default function CompanyInboxJobPage() {
  const params = useParams<{ jobId: string }>();
  const { data: job } = useJob(params.jobId);

  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <div className="flex flex-col gap-6">
          <Link
            href="/company/inbox"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inbox
          </Link>
          <PageHeader
            variant="banner"
            title={job?.title ?? "Recruiters"}
            subtitle="Recruiters who submitted to this job, sorted by their review rating."
            className="mb-0"
          />
          <InboxRecruitersTable jobId={params.jobId} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
