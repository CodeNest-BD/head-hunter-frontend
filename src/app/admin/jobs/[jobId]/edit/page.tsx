"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobForm, useJob } from "@/features/jobs";
import { useUpdateAdminJob } from "@/features/admin";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * Admin job editor. An admin can read any job through the authed detail
 * endpoint (admin visibility returns everything), so this reuses the same
 * JobForm the company uses and saves through the admin job endpoint.
 */
function EditContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data: job, isPending, isError, refetch } = useJob(jobId);
  const update = useUpdateAdminJob();

  if (isPending) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    );
  }
  if (isError || !job) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        <span className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
          Could not load this job.
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <JobForm
        job={job}
        isSubmitting={update.isPending}
        submitLabel="Save changes"
        onSubmit={(input) =>
          update.mutate(
            { jobId, input: input as unknown as Record<string, unknown> },
            { onSuccess: () => router.push("/admin/jobs") },
          )
        }
      />
    </div>
  );
}

export default function AdminEditJobPage() {
  const params = useParams<{ jobId: string }>();

  return (
    <RequireRole role="admin">
      <DashboardLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/admin/jobs" },
          { label: "Edit" },
        ]}
      >
        <div className="flex max-w-3xl flex-col gap-6">
          <Link
            href="/admin/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
          <PageHeader
            title="Edit job"
            subtitle="Admin edit — changes apply to the company's live listing."
            className="mb-0"
          />
          <EditContent jobId={params.jobId} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
