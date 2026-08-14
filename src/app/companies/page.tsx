"use client";

import { RequireRole } from "@/features/auth";
import { CompanyList } from "@/features/companies";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompaniesPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <PageHeader title="Companies" />
          <CompanyList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
