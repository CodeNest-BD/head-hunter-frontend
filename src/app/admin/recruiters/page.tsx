"use client";

import { RequireRole } from "@/features/auth";
import { RecruitersTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { Breadcrumb } from "@/shared/ui-components/layout/Breadcrumb";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminRecruitersPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout wide>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Recruiters" },
              ]}
            />
            <PageHeader
              title="Recruiters"
              subtitle="Every recruiter on the platform. Open a profile or hold an account."
            />
          </div>
          <RecruitersTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
