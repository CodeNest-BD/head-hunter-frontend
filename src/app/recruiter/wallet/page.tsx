"use client";

import { RequireRole } from "@/features/auth";
import { RecruiterWalletPanel } from "@/features/billing";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function RecruiterWalletPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="w-full">
          <RecruiterWalletPanel />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
