"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { RecruiterPayoutsBoard } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
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
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Recruiter Payouts"
            subtitle={
              <>
                Commissions owed to recruiters, from the 30-day guarantee to the
                bank. Company deposits and wallets are in{" "}
                <Link
                  href="/admin/payments"
                  className="font-medium text-blue-ink hover:underline"
                >
                  Company Payments
                </Link>
                .
              </>
            }
          />
          <Suspense fallback={null}>
            <BoardContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
