"use client";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { JobForm, useCreateAndPublishJob, useCreateJob } from "@/features/jobs";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function NewJobPage() {
  const create = useCreateJob();
  const createAndPublish = useCreateAndPublishJob();

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <RequireApprovedCompany>
          <div className="flex w-full flex-col gap-4">
            <div>
              <BackLink href="/company/jobs">Back to Jobs</BackLink>
              <PageHeader
                title="Post a Job"
                subtitle="Save it as a draft, or publish it live right away — publishing reserves the fee and notifies recruiters. The more details provided, the stronger match recruiters are able to make."
              />
            </div>
            <JobForm
              onSubmit={(input, intent, benefitsDocument) =>
                intent === "publish"
                  ? createAndPublish.mutate({ input, benefitsDocument })
                  : create.mutate({ input, benefitsDocument })
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
