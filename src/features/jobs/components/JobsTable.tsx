"use client";

import Link from "next/link";
import { formatMinor } from "@/shared/utils/money";
import { ROLE_CATEGORY_LABELS } from "../schemas";
import { useJobs } from "../hooks/useJobs";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  published: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  filled: "bg-blue-100 text-blue-800",
  closed: "bg-zinc-200 text-zinc-600",
};

export function JobsTable() {
  const { data, isPending, isError, refetch } = useJobs({ limit: 50 });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading jobs…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load jobs.{" "}
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

  if (data.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No jobs yet.{" "}
        <Link href="/company/jobs/new" className="underline">
          Create your first one.
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Fee</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((job) => (
            <tr key={job.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/company/jobs/${job.id}`}
                  className="font-medium underline"
                >
                  {job.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {ROLE_CATEGORY_LABELS[job.roleCategory]}
              </td>
              <td className="px-4 py-3">
                {formatMinor(job.recruiterFeeMinor)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_STYLES[job.status] ?? "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {job.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
