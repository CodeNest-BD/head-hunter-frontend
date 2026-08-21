"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { JobsTable } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function JobsContent() {
  const searchParams = useSearchParams();
  return (
    <JobsTable
      companyProfileId={searchParams.get("companyProfileId") ?? undefined}
      companyName={searchParams.get("companyName") ?? undefined}
      initialStatus={searchParams.get("status") ?? ""}
    />
  );
}

export default function AdminJobsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs" },
        ]}
      >
        <Suspense fallback={null}>
          <JobsContent />
        </Suspense>
      </DashboardLayout>
    </RequireRole>
  );
}
