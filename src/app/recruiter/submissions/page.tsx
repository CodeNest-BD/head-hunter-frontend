"use client";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { SubmissionsTable } from "@/features/inbox";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * Every candidate the recruiter has submitted, across all jobs — one row per
 * submission, filterable by candidate, company and job. The per-job view under
 * the inbox stays; this is the flat, cross-job roll-up.
 */
export default function RecruiterSubmissionsPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <div className="flex flex-col gap-6">
            <PageHeader
              title="Submissions"
              subtitle="Every candidate you've submitted, across all jobs. Open one for its conversation."
              className="mb-0"
            />
            <SubmissionsTable />
          </div>
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}
