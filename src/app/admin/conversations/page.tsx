"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { ConversationsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function ConversationsContent() {
  const searchParams = useSearchParams();
  return (
    <ConversationsTable
      jobId={searchParams.get("jobId") ?? undefined}
      jobTitle={searchParams.get("jobTitle") ?? undefined}
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
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Conversations"
            subtitle="Company↔recruiter interaction on every submission — candidates, scheduling and offers."
          />
          <Suspense fallback={null}>
            <ConversationsContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
