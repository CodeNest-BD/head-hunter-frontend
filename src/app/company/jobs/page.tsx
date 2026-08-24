"use client";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { JobsTable } from "@/features/jobs";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyJobsPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <RequireApprovedCompany>
          <JobsTable />
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
