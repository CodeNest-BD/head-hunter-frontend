"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobsTable } from "@/features/jobs";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyJobsPage() {
  return (
    <RequireRole role="company">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Jobs
              </h1>
              <p className="text-sm text-muted-foreground">
                Create a job, then publish it to notify your followers.
              </p>
            </div>
            <Button asChild>
              <Link href="/company/jobs/new">
                <Plus className="h-[18px] w-[18px]" />
                New job
              </Link>
            </Button>
          </header>
          <JobsTable />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
