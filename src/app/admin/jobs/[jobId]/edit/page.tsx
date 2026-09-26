"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobForm, useJob } from "@/features/jobs";
import {
  ConfirmActionDialog,
  useRepostAdminJob,
  useUpdateAdminJob,
} from "@/features/admin";
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
  const repost = useRepostAdminJob();
  const [confirmRepost, setConfirmRepost] = useState(false);

  if (isPending) {
    return (
      <div className="h-64 animate-pulse rounded-md border border-border bg-card" />
    );
  }
  if (isError || !job) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
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
    <div className="flex flex-col gap-4">
      {job.status === "expired" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#F0E2B8] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5109]">
          <span>
            This listing lapsed after 30 days. Re-posting publishes it again on
            the company&rsquo;s behalf.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => setConfirmRepost(true)}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Re-post for 30 Days
          </Button>
        </div>
      )}
      <ConfirmActionDialog
        open={confirmRepost}
        onOpenChange={setConfirmRepost}
        title="Re-post this job?"
        description="It goes live again for 30 days on the company's behalf. The recruiter fee is re-checked against the current floor and the company's funds."
        confirmLabel="Re-post job"
        pendingLabel="Re-posting…"
        isPending={repost.isPending}
        onConfirm={() =>
          repost.mutate(jobId, { onSuccess: () => setConfirmRepost(false) })
        }
      />
      <JobForm
        job={job}
        isSubmitting={update.isPending}
        submitLabel="Save changes"
        onCancel={() => router.push("/admin/jobs")}
        // The admin endpoint cannot presign an upload against a company's job,
        // so the benefits document is shown and removable but not replaceable.
        canAttachBenefitsDocument={false}
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
        <div className="flex w-full flex-col gap-4">
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
