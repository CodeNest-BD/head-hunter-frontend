"use client";

import { RequireRole } from "@/features/auth";
import { RecruitersTable } from "@/features/admin";
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
        <RecruitersTable />
      </DashboardLayout>
    </RequireRole>
  );
}
