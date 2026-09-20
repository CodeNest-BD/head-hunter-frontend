"use client";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { InboxConversationList } from "@/features/inbox";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The recruiter's inbox: a flat list of your conversations with companies,
 * most-recent first. Click a row to open the conversation directly.
 */
export default function RecruiterInboxPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <InboxConversationList side="recruiter" />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
