"use client";

import { RequireRole } from "@/features/auth";
import { DisputesTable } from "@/features/admin";
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
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Disputes"
            subtitle="Contested placements. Resolving moves the escrowed money: release to the recruiter, refund to the company, or split."
          />
          <DisputesTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
