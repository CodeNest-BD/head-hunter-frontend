"use client";

import { RequireRole } from "@/features/auth";
import { RecruitersTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminRecruitersPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout wide>
        <div className="flex flex-col gap-8">
          <PageHeader
            eyebrow="Admin"
            title="Recruiters"
            subtitle="Every recruiter on the platform. Open a profile or hold an account."
          />
          <RecruitersTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
