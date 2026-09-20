"use client";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { InboxConversationList } from "@/features/inbox";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The inbox: a flat list of your recruiter conversations, most-recent first.
 * Click a row to open the conversation directly.
 */
export default function CompanyInboxPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <RequireApprovedCompany>
          <InboxConversationList side="company" />
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
