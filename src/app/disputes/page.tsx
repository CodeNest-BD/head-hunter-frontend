"use client";

import { RequireRole } from "@/features/auth";
import { MyDisputesList } from "@/features/disputes";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function DisputesPage() {
  return (
    <RequireRole role={["company", "recruiter"]}>
      <DashboardLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Disputes" },
        ]}
      >
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Disputes"
            subtitle="Open a dispute on a placement held in escrow, and message support privately about it."
          />
          <MyDisputesList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
