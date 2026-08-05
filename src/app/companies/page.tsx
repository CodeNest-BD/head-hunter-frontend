"use client";

import { RequireRole } from "@/features/auth";
import { CompanyList } from "@/features/companies";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompaniesPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Companies
            </h1>
            <p className="text-sm text-muted-foreground">
              Follow a company to be notified when it posts a job.
            </p>
          </header>
          <CompanyList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
