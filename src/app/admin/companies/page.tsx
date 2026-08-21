"use client";

import { RequireRole } from "@/features/auth";
import { CompaniesTable } from "@/features/admin";
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
        <CompaniesTable />
      </DashboardLayout>
    </RequireRole>
  );
}
