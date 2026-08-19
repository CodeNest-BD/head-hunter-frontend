"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobsTable } from "@/features/jobs";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyJobsPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout wide>
        <div className="flex flex-col gap-6">
          <PageHeader
            variant="banner"
            title="Jobs"
            subtitle="Create a job, then publish it to notify your followers."
            actions={
              <Button asChild>
                <Link href="/company/jobs/new">
                  <Plus className="h-[18px] w-[18px]" />
                  New job
                </Link>
              </Button>
            }
          />
          <JobsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
