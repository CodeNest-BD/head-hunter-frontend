"use client";

import { RequireRole } from "@/features/auth";
import {
  AdminManagement,
  MinFeeCard,
  RecruiterPricingCard,
} from "@/features/admin";
import { PHASE1_FREE } from "@/shared/config/featureFlags";
import { PageBanner } from "@/shared/ui-components/brand";
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
        <div className="flex flex-col gap-6">
          <PageBanner
            title="Settings"
            subtitle="Marketplace policy and admin accounts."
          />
          <MinFeeCard />
          {/* Subscription pricing returns when the phase-1 free period ends. */}
          {!PHASE1_FREE && <RecruiterPricingCard />}
          <AdminManagement />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
