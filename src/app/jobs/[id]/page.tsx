"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireRole } from "@/features/auth";
import { ROLE_CATEGORY_LABELS, useJob } from "@/features/jobs";
import { formatMinor } from "@/shared/utils/money";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function JobDetailContent({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, error, refetch } = useJob(jobId);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading job…</p>;
  }
  if (isError) {
    // The most likely cause is the subscription paywall, so say so rather than
    // showing a bare failure.
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-destructive">
          Could not load this job. {(error as Error | undefined)?.message ?? ""}
        </p>
        <p className="text-sm text-muted-foreground">
          If you are not subscribed yet, activate your subscription on your{" "}
          <Link href="/recruiter/profile" className="underline">
            profile
          </Link>
          .
        </p>
        <div>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const location = job.isRemote
    ? "Remote"
    : [job.locationCity, job.locationState].filter(Boolean).join(", ") || "—";
  const salary =
    job.salaryMinMinor === null && job.salaryMaxMinor === null
      ? "—"
      : `${formatMinor(job.salaryMinMinor)} – ${formatMinor(job.salaryMaxMinor)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">Recruiter fee</p>
        <p className="text-2xl font-semibold">
          {formatMinor(job.recruiterFeeMinor)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Paid on a successful hire, after the 30-day guarantee.
        </p>
      </div>

      <dl className="grid grid-cols-[10rem_1fr] gap-y-3 text-sm">
        <Detail
          label="Category"
          value={ROLE_CATEGORY_LABELS[job.roleCategory]}
        />
        <Detail label="Location" value={location} />
        <Detail label="Salary range" value={salary} />
        <Detail label="Status" value={job.status} />
      </dl>

      {job.description && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {job.description}
          </p>
        </section>
      )}
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="recruiter">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground underline"
          >
            Back to jobs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Job</h1>
        </div>
        <JobDetailContent jobId={params.id} />
      </main>
    </RequireRole>
  );
}
