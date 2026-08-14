"use client";

import { RequireRole } from "@/features/auth";
import { ConversationsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

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
          <ConversationsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
