"use client";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { CompanyList } from "@/features/companies";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompaniesPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <CompanyList />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
