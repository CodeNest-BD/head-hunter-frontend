"use client";

import {
  AdminManagement,
  MinFeeCard,
  RecruiterPricingCard,
} from "@/features/admin";
import { AccountCard, RequireRole } from "@/features/auth";
import { PHASE1_FREE } from "@/shared/config/featureFlags";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { SettingsLayout } from "@/shared/ui-components/layout/SettingsLayout";

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
        <div className="flex flex-col gap-5">
          <PageHeader
            title="Settings"
            subtitle="Your admin account, the marketplace policy you set, and who else can administer it."
          />
          <SettingsLayout
            sections={[
              { id: "account", label: "Account", content: <AccountCard /> },
              {
                id: "policy",
                label: "Marketplace Policy",
                content: (
                  <>
                    <MinFeeCard />
                    {/* Subscription pricing returns when the phase-1 free
                        period ends. */}
                    {!PHASE1_FREE && <RecruiterPricingCard />}
                  </>
                ),
              },
              {
                id: "admins",
                label: "Admin Accounts",
                content: <AdminManagement />,
              },
            ]}
          />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
