"use client";

import { RequireRole } from "@/features/auth";
import { CompanyList } from "@/features/companies";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompaniesPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <CompanyList />
      </DashboardLayout>
    </RequireRole>
  );
}
