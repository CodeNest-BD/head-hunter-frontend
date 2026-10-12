"use client";

import { RequireRole } from "@/features/auth";
import { SubmissionsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminSubmissionsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Submissions" },
        ]}
      >
        <div className="flex flex-col gap-4">
          <PageHeader title="Candidate Submissions" />
          <SubmissionsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
