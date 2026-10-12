"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { AdminDisputesTable } from "@/features/disputes";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function DisputesContent() {
  const searchParams = useSearchParams();
  return (
    <AdminDisputesTable
      companyProfileId={searchParams.get("companyProfileId") ?? undefined}
      companyName={searchParams.get("companyName") ?? undefined}
    />
  );
}

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
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Disputes"
            subtitle="Company↔recruiter escrow disputes. Mediate each side privately, then refund the company or pay the recruiter."
          />
          <Suspense fallback={null}>
            <DisputesContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
