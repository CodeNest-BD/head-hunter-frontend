"use client";

import { RequireRole } from "@/features/auth";
import { AdminJobDetail } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminJobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/admin/jobs" },
          { label: "Job" },
        ]}
      >
        <AdminJobDetail jobRef={params.jobId} />
      </DashboardLayout>
    </RequireRole>
  );
}
