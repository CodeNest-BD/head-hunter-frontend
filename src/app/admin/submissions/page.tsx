"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { SubmissionsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function SubmissionsContent() {
  const searchParams = useSearchParams();
  return (
    <SubmissionsTable initialJobId={searchParams.get("jobId") ?? undefined} />
  );
}

export default function AdminSubmissionsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Submissions" },
        ]}
      >
        <div className="flex flex-col gap-4">
          <PageHeader title="Candidate Submissions" />
          <Suspense fallback={null}>
            <SubmissionsContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
