"use client";

import { RequireRole } from "@/features/auth";
import { CompanyList } from "@/features/companies";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompaniesPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Companies"
            subtitle="Follow a company to be notified when it posts a job."
          />
          <CompanyList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
