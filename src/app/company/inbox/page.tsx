"use client";

import { RequireRole } from "@/features/auth";
import { InboxJobsTable } from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The inbox drill-down, level 1: your jobs with submission counts. Click a
 * job for its recruiters (sorted by review rating), then a recruiter for the
 * conversation.
 */
export default function CompanyInboxPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Inbox"
            subtitle="Every job with submissions — pick one to see its recruiters and candidates."
          />
          <InboxJobsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
