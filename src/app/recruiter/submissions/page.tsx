"use client";

import { RequireRole } from "@/features/auth";
import { SubmissionList } from "@/features/submissions";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function RecruiterSubmissionsPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <SubmissionList />
      </DashboardLayout>
    </RequireRole>
  );
}
