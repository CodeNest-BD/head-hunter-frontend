"use client";

import { RequireRole } from "@/features/auth";
import { CompaniesTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { Breadcrumb } from "@/shared/ui-components/layout/Breadcrumb";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminCompaniesPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout wide>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Companies" },
              ]}
            />
            <PageHeader
              title="Companies"
              subtitle="Every company on the platform, their wallet, and account controls."
            />
          </div>
          <CompaniesTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
