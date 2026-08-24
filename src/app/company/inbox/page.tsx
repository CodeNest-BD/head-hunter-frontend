"use client";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { InboxJobsTable } from "@/features/submissions";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The inbox drill-down, level 1: your jobs with submission counts. Click a
 * job for its recruiters (sorted by review rating), then a recruiter for the
 * conversation.
 */
export default function CompanyInboxPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <RequireApprovedCompany>
          <InboxJobsTable />
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
