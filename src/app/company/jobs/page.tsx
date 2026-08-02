"use client";

import { RequireRole } from "@/features/auth";
import Link from "next/link";
import { JobsTable } from "@/features/jobs";
import { Button } from "@/shared/ui-components/controls/button";

export default function CompanyJobsPage() {
  return (
    <RequireRole role="company">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
            <Button asChild size="sm">
              <Link href="/company/jobs/new">New job</Link>
            </Button>
          </div>
        </div>
        <JobsTable />
      </main>
    </RequireRole>
  );
}
