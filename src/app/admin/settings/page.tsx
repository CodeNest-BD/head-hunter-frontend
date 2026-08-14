"use client";

import { RequireRole } from "@/features/auth";
import { AdminManagement, RecruiterPricingCard } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminSettingsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      >
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Settings"
            subtitle="Recruiter subscription pricing and admin accounts."
          />
          <RecruiterPricingCard />
          <AdminManagement />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
