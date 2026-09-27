"use client";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { CompanySubmissionsQueue } from "@/features/inbox";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * The company inbox as a Job-based Candidate Submission Queue (see
 * requirements/Company_inbox_requirement.pdf): stat cards per status, filters
 * for job/status/recruiter, rating-priority ordering, and a table whose rows
 * open the conversation thread.
 */
export default function CompanyInboxPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <RequireApprovedCompany>
          <CompanySubmissionsQueue />
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
