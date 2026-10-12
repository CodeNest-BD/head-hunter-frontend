"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { RecruiterPayoutsBoard } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function BoardContent() {
  const searchParams = useSearchParams();
  return (
    <RecruiterPayoutsBoard
      recruiterProfileId={searchParams.get("recruiter") ?? undefined}
      recruiterName={searchParams.get("recruiterName") ?? undefined}
    />
  );
}

export default function AdminPayoutsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recruiter Payouts" },
        ]}
      >
        <Suspense fallback={null}>
          <BoardContent />
        </Suspense>
      </DashboardLayout>
    </RequireRole>
  );
}
