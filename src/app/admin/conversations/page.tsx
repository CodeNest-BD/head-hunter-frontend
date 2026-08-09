"use client";

import { RequireRole } from "@/features/auth";
import { ConversationsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminConversationsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout wide>
        <div className="flex flex-col gap-8">
          <PageHeader
            eyebrow="Admin"
            title="Conversations"
            subtitle="Company↔recruiter interaction on every submission — candidates, scheduling and offers."
          />
          <ConversationsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
