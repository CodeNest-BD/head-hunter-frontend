"use client";

import { RequireRole } from "@/features/auth";
import { RecruitersTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminRecruitersPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recruiters" },
        ]}
      >
        <div className="flex flex-col gap-8">
          <PageHeader title="Recruiters" />
          <RecruitersTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
