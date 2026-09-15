"use client";

import { RequireRole } from "@/features/auth";
import { AdminDisputeView } from "@/features/disputes";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminDisputeDetailPage({
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
          { label: "Disputes", href: "/admin/disputes" },
          { label: "Review" },
        ]}
      >
        <AdminDisputeView id={params.id} />
      </DashboardLayout>
    </RequireRole>
  );
}
