"use client";

import { RequireRole } from "@/features/auth";
import { AdminPayoutDetail } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminPayoutPage({
  params,
}: {
  params: { ref: string };
}) {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recruiter Payouts", href: "/admin/payouts" },
          { label: `PLC-${params.ref}` },
        ]}
      >
        <AdminPayoutDetail payoutRef={params.ref} />
      </DashboardLayout>
    </RequireRole>
  );
}
