"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { ConversationsBoard } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function ConversationsContent() {
  const searchParams = useSearchParams();
  return (
    <ConversationsBoard
      companyProfileId={searchParams.get("companyProfileId") ?? undefined}
      companyName={searchParams.get("companyName") ?? undefined}
      initialCandidateId={searchParams.get("thread") ?? undefined}
    />
  );
}

export default function AdminConversationsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conversations" },
        ]}
      >
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Conversations"
            subtitle="Every Company ↔ Recruiter thread, with hiring events in line. Admin view is read-only."
          />
          <Suspense fallback={null}>
            <ConversationsContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
