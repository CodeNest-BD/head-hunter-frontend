"use client";

import { RequireRole } from "@/features/auth";
import { RecruiterDetail } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminRecruiterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recruiters", href: "/admin/recruiters" },
          { label: "Profile" },
        ]}
      >
        <RecruiterDetail userId={params.id} />
      </DashboardLayout>
    </RequireRole>
  );
}
