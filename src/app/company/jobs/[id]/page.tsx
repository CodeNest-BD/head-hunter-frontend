"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { JobForm } from "@/features/jobs/components/JobForm";
import {
  usePublishJob,
  useJob,
  useUpdateJob,
} from "@/features/jobs/hooks/useJobs";
import { RequireRole } from "@/shared/components/RequireRole";
import { Button } from "@/shared/ui-components/controls/button";

function EditJobContent({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, refetch } = useJob(jobId);
  const update = useUpdateJob(jobId);
  const { publish, isPending: isPublishing } = usePublishJob(jobId);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading job…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load this job.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </p>
    );
  }

  const isDraft = job.status === "draft";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{job.status}</p>
        </div>
        {isDraft ? (
          <Button type="button" disabled={isPublishing} onClick={publish}>
            {isPublishing ? "Publishing…" : "Publish"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Published
            {job.publishedAt
              ? ` on ${job.publishedAt.toLocaleDateString()}`
              : ""}
          </p>
        )}
      </div>

      <JobForm
        job={job}
        onSubmit={(input) => update.mutate(input)}
        isSubmitting={update.isPending}
        submitLabel="Save changes"
      />
    </div>
  );
}

export default function EditJobPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="company">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/company/jobs"
            className="text-sm text-muted-foreground underline"
          >
            Back to jobs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit job</h1>
        </div>
        <EditJobContent jobId={params.id} />
      </main>
    </RequireRole>
  );
}
