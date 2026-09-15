"use client";

import { RequireRole } from "@/features/auth";
import { ParticipantDisputeView } from "@/features/disputes";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function DisputeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <RequireRole role={["company", "recruiter"]}>
      <DashboardLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Disputes", href: "/disputes" },
          { label: "Detail" },
        ]}
      >
        <ParticipantDisputeView id={params.id} />
      </DashboardLayout>
    </RequireRole>
  );
}
