"use client";

import { RequireRole } from "@/features/auth";
import { ConversationThread } from "@/features/admin";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function AdminConversationThreadPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conversations", href: "/admin/conversations" },
          { label: "Thread" },
        ]}
      >
        <ConversationThread submissionId={params.id} />
      </DashboardLayout>
    </RequireRole>
  );
}
