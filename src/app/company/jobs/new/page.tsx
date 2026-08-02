"use client";

import { RequireRole } from "@/features/auth";
import Link from "next/link";
import { JobForm, useCreateJob } from "@/features/jobs";

export default function NewJobPage() {
  const create = useCreateJob();

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
          <h1 className="text-2xl font-bold tracking-tight">New job</h1>
          <p className="text-sm text-muted-foreground">
            Saved as a draft. You publish it from the job page, which is when
            followers are notified.
          </p>
        </div>
        <JobForm
          onSubmit={(input) => create.mutate(input)}
          isSubmitting={create.isPending}
          submitLabel="Save draft"
        />
      </main>
    </RequireRole>
  );
}
