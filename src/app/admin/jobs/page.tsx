"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { JobsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
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
        <div className="flex flex-col gap-8">
          <PageHeader
            variant="banner"
            title="Jobs"
            subtitle="Every job posted on the platform. Filter by company, status or title."
          />
          <Suspense fallback={null}>
            <JobsContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
