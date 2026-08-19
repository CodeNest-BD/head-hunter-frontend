"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
    <div className="flex flex-col gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EditJobContent({ jobId }: { jobId: string }) {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <StatusBadge
            label={job.status}
            className={cn(
              "w-fit",
              STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground",
              "capitalize",
            )}
          />
        </div>
        {isDraft || isExpired ? (
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <Button type="button" disabled={isPublishing} onClick={publish}>
              {isPublishing
                ? "Publishing…"
                : isExpired
                  ? "Republish for 30 days"
                  : "Publish"}
            </Button>
            {isExpired && (
              <p className="text-xs text-muted-foreground">
                This listing lapsed after 30 days; republishing reserves the fee
                again.
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-[#17734E]" />
            Published
            {job.publishedAt
              ? ` on ${job.publishedAt.toLocaleDateString()}`
              : ""}
          </p>
        )}
      </div>

      <div className="rounded-md border border-border/70 bg-card p-6 shadow-sm">
        <JobForm
          job={job}
          onSubmit={(input) => update.mutate(input)}
          isSubmitting={update.isPending}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}

export default function EditJobPage() {
  const params = useParams<{ id: string }>();

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
            title="Edit job"
            subtitle="Update the details, then publish when you are ready."
            className="mb-0"
          />
          <EditJobContent jobId={params.id} />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
