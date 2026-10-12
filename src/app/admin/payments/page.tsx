"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { CompanyPaymentsBoard } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function BoardContent() {
  const searchParams = useSearchParams();
  return (
    <CompanyPaymentsBoard
      companyProfileId={searchParams.get("company") ?? undefined}
      companyName={searchParams.get("companyName") ?? undefined}
    />
  );
}

export default function AdminPaymentsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Company Payments" },
        ]}
      >
        <Suspense fallback={null}>
          <BoardContent />
        </Suspense>
      </DashboardLayout>
    </RequireRole>
  );
}
