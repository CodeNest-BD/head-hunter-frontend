"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobForm, useCreateJob } from "@/features/jobs";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function NewJobPage() {
  const create = useCreateJob();

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <div className="flex max-w-2xl flex-col gap-6">
          <Link
            href="/company/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
          <PageHeader
            title="New job"
            subtitle="Saved as a draft. You publish it from the job page, which is when followers are notified."
            className="mb-0"
          />
          <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
            <JobForm
              onSubmit={(input) => create.mutate(input)}
              isSubmitting={create.isPending}
              submitLabel="Save draft"
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
