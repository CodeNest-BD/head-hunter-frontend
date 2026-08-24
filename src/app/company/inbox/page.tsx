"use client";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { InboxJobsTable } from "@/features/inbox";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The inbox drill-down, level 1: your jobs with candidate counts. Click a job
 * for the candidates sent to it, then a candidate for their conversation.
 */
export default function CompanyInboxPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <RequireApprovedCompany>
          <InboxJobsTable side="company" />
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
