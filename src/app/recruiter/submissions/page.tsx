"use client";

import { RequireRole } from "@/features/auth";
import { SubmissionList } from "@/features/submissions";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function RecruiterSubmissionsPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Submissions"
            subtitle="Every candidate you've submitted, and where each one stands."
          />
          <SubmissionList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
