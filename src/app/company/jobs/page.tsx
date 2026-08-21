"use client";

import { RequireRole } from "@/features/auth";
import { JobsTable } from "@/features/jobs";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyJobsPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <JobsTable />
      </DashboardLayout>
    </RequireRole>
  );
}
