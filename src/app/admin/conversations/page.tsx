"use client";

import { RequireRole } from "@/features/auth";
import { ConversationsTable } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { Breadcrumb } from "@/shared/ui-components/layout/Breadcrumb";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminConversationsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout wide>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Conversations" },
              ]}
            />
            <PageHeader
              title="Conversations"
              subtitle="Company↔recruiter interaction on every submission — candidates, scheduling and offers."
            />
          </div>
          <ConversationsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
