"use client";

import { RequireRole } from "@/features/auth";
import { CompanyPlacementsTable } from "@/features/placements";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyPlacementsPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Placements"
            subtitle="Hired candidates and their escrowed commissions. You can dispute a placement while the commission is still held."
          />
          <CompanyPlacementsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
