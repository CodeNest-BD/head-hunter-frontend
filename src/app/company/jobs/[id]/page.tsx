"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

import { RequireRole } from "@/features/auth";
import { JobForm, useJob, usePublishJob, useUpdateJob } from "@/features/jobs";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { cn } from "@/shared/libs/shadCnConfig";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "text-[#17734E] bg-[#E7F4EC]",
  expired: "text-[#9B3535] bg-[#FBEAEA]",
  paused: "text-[#92610C] bg-[#FBF3DF]",
  filled: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
};

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-72 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
      <div className="h-48 w-full animate-pulse rounded-md border border-border/70 bg-muted" />
    </div>
  );
}

function EditJobContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data: job, isPending, isError, refetch } = useJob(jobId);
  const update = useUpdateJob(jobId);
  const { publish, isPending: isPublishing } = usePublishJob(jobId);

  if (isPending) {
    return <FormSkeleton />;
  }
  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-[18px] w-[18px]" />
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Edit job
            <StatusBadge
              label={job.status}
              className={cn(
                "text-xs",
                STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground",
                "capitalize",
              )}
            />
          </span>
        }
        subtitle="Update the details, then publish when you are ready."
        actions={
          canPublish ? (
            <Button type="button" disabled={isPublishing} onClick={publish}>
              {isPublishing
                ? "Publishing…"
                : isExpired
                  ? "Republish for 30 days"
                  : "Publish"}
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-[#17734E]" />
              Published
              {job.publishedAt
                ? ` on ${job.publishedAt.toLocaleDateString()}`
                : ""}
            </span>
          )
        }
      />

      {isExpired && (
        <p className="rounded-md border border-[#F0E2B8] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5109]">
          This listing lapsed after 30 days; republishing reserves the fee
          again.
        </p>
      )}

      <JobForm
        job={job}
        onSubmit={(input) => update.mutate(input)}
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
        <div className="flex w-full flex-col gap-4">
          <Link
            href="/company/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </Link>
          <EditJobContent jobId={params.id} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
