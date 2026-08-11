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
            eyebrow="Your submissions"
            title="Submissions & messages"
            subtitle="Every candidate you've submitted, where each one stands, and your conversation with the company about each role."
          />
          <SubmissionList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
