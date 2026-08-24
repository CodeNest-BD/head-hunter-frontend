"use client";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { InboxJobsTable } from "@/features/inbox";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The recruiter's inbox, level 1: every job you have sent someone to. Click a
 * job for your candidates on it, then a candidate for their conversation.
 */
export default function RecruiterInboxPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <InboxJobsTable side="recruiter" />
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
