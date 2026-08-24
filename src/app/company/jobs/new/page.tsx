"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { JobForm, useCreateAndPublishJob, useCreateJob } from "@/features/jobs";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function NewJobPage() {
  const create = useCreateJob();
  const createAndPublish = useCreateAndPublishJob();

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <RequireApprovedCompany>
          <div className="flex w-full flex-col gap-6">
            <Link
              href="/company/jobs"
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </Link>
            <PageHeader
              title="Post a job"
              subtitle="Save it as a draft, or publish it live right away — publishing reserves the fee and notifies recruiters."
              className="mb-0"
            />
            <JobForm
              onSubmit={(input, intent) =>
                intent === "publish"
                  ? createAndPublish.mutate(input)
                  : create.mutate(input)
              }
              isSubmitting={create.isPending || createAndPublish.isPending}
              submitLabel="Save draft"
            />
          </div>
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
