"use client";

import { RequireRole } from "@/features/auth";
import { CompanyDetail } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminCompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <RequireRole role="admin">
      <DashboardLayout>
        <CompanyDetail userId={params.id} />
      </DashboardLayout>
    </RequireRole>
  );
}
