"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { CompanyPaymentsBoard } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function BoardContent() {
  const searchParams = useSearchParams();
  return (
    <CompanyPaymentsBoard
      companyProfileId={searchParams.get("company") ?? undefined}
      companyName={searchParams.get("companyName") ?? undefined}
    />
  );
}

export default function AdminPaymentsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Company Payments" },
        ]}
      >
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Company Payments"
            subtitle={
              <>
                Money coming in from companies and how it moves inside their
                wallets. Recruiter commissions are in{" "}
                <Link
                  href="/admin/payouts"
                  className="font-medium text-blue-ink hover:underline"
                >
                  Recruiter Payouts
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
