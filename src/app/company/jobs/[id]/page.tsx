"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import {
  JobForm,
  JobFormPublishButton,
  useJob,
  useUpdateJob,
  type JobWriteInput,
} from "@/features/jobs";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import type { PillTone } from "@/shared/ui-components/badges/Pill";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { cn } from "@/shared/libs/shadCnConfig";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/** Mirrors the jobs table's own status tones. */
const STATUS_TONES: Record<string, PillTone> = {
  draft: "neutral",
  published: "ok",
  expired: "bad",
  paused: "warn",
  filled: "info",
  closed: "neutral",
};

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-72 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
      <div className="h-48 w-full animate-pulse rounded-md border border-line bg-surface-sub" />
    </div>
  );
}

function EditJobContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data: job, isPending, isError, refetch } = useJob(jobId);
  const update = useUpdateJob(jobId);
  if (isPending) {
    return <FormSkeleton />;
  }
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <div className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
          Could not load this job.
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isDraft = job.status === "draft";
  // Expired listings republish through the same transition: re-reserves the
  // fee and restarts the 30-day clock.
  const isExpired = job.status === "expired";
  const canPublish = isDraft || isExpired;

  // Saved first, then published: the form may hold edits the stored copy
  // lacks, and those are what the publish rules just passed.
  const saveAndPublish = (
    input: JobWriteInput,
    benefitsDocument: File | null,
  ) =>
    update.mutate(
      { input, benefitsDocument },
      {
        onSuccess: ({ benefitsDocumentFailed }) =>
          update.mutate(
            { input: { status: "published" } },
            {
              onSuccess: () => {
                toast.success(
                  "Job published. Recruiters can now submit candidates.",
                );
                if (!benefitsDocumentFailed) router.push("/company/jobs");
              },
            },
          ),
      },
    );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Edit job
            <StatusBadge
              label={job.status}
              tone={STATUS_TONES[job.status] ?? "neutral"}
              className="capitalize"
            />
          </span>
        }
        subtitle="Update the details, then publish when you are ready."
        actions={
          canPublish ? (
            <JobFormPublishButton disabled={update.isPending}>
              {update.isPending
                ? "Publishing…"
                : isExpired
                  ? "Republish for 30 days"
                  : "Publish"}
            </JobFormPublishButton>
          ) : (
            <span className="flex items-center gap-1.5 text-sub text-ink-muted">
              <CheckCircle2 className="size-[15px] text-ok" />
              Published
              {job.publishedAt
                ? ` on ${job.publishedAt.toLocaleDateString()}`
                : ""}
            </span>
          )
        }
      />

      {isExpired && (
        <Alert tone="warn">
          This listing lapsed after 30 days; republishing reserves the fee
          again.
        </Alert>
      )}

      <JobForm
        job={job}
        onSubmit={(input, intent, benefitsDocument) =>
          intent === "publish"
            ? saveAndPublish(input, benefitsDocument)
            : update.mutate(
                { input, benefitsDocument },
                {
                  onSuccess: ({ benefitsDocumentFailed }) => {
                    // The hook has already said so; stay put so the company can
                    // re-attach instead of being sent away from the field.
                    if (benefitsDocumentFailed) return;
                    toast.success("Job updated");
                    router.push("/company/jobs");
                  },
                },
              )
        }
        isSubmitting={update.isPending}
        submitLabel="Save changes"
        onCancel={() => router.push("/company/jobs")}
      />
    </div>
  );
}

export default function EditJobPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <RequireApprovedCompany>
          <div className="flex w-full flex-col">
            <BackLink href="/company/jobs">Back to jobs</BackLink>
            <EditJobContent jobId={params.id} />
          </div>
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
