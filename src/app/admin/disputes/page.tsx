"use client";

import { RequireRole } from "@/features/auth";
import { AdminDisputesTable } from "@/features/disputes";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminDisputesPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Disputes" },
        ]}
      >
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Disputes"
            subtitle="Company↔recruiter escrow disputes. Mediate each side privately, then refund the company or pay the recruiter."
          />
          <AdminDisputesTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
