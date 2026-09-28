"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, RotateCcw } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobForm, useJob } from "@/features/jobs";
import { useRepostAdminJob, useUpdateAdminJob } from "@/features/admin";
import { ConfirmActionDialog } from "@/shared/ui-components/controls/ConfirmActionDialog";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
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
    // The same two-card shape the company's job editor stands in with — this
    // page renders the very same `JobForm`.
    return (
      <div className="flex flex-col gap-4">
        <div className="h-72 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
        <div className="h-48 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
      </div>
    );
  }
  if (isError || !job) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <span className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
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
        /* The `.alert--warn` band: what lapsed, and the one action that fixes it. */
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warn-line bg-warn-bg px-3.5 py-[11px] text-sub text-warn">
          <span>
            This listing lapsed after 30 days. Re-posting publishes it again on
            the company&rsquo;s behalf.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => setConfirmRepost(true)}
          >
            <RotateCcw />
            Re-post for 30 days
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
            // `JobWriteInput` is an interface, so it carries no implicit index
            // signature for the mutation's `Record<string, unknown>` payload.
            { jobId, input: { ...input } },
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
          <div>
            <BackLink href="/admin/jobs">Back to jobs</BackLink>
            <PageHeader
              title="Edit job"
              subtitle="Admin edit — changes apply to the company's live listing."
            />
          </div>
          <EditContent jobId={params.jobId} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
