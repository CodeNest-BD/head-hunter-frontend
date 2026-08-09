"use client";

import { RequireRole } from "@/features/auth";
import { CompaniesTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminCompaniesPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <PageHeader
            eyebrow="Admin"
            title="Companies"
            subtitle="Every company on the platform, their wallet, and account controls."
          />
          <CompaniesTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
