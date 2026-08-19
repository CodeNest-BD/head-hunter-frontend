"use client";

import { RequireRole } from "@/features/auth";
import { CompaniesTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminCompaniesPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Companies" },
        ]}
      >
        <div className="flex flex-col gap-6">
          <PageHeader
            variant="banner"
            title="Companies"
            subtitle="Every company on the platform, their wallet, and account controls."
          />
          <CompaniesTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
