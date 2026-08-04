"use client";

import Link from "next/link";
import { useJobs } from "@/features/jobs";
import { useSubmissions } from "../hooks/useSubmissions";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "../schemas";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-amber-100 text-amber-800",
  advanced: "bg-green-100 text-green-800",
  rejected: "bg-zinc-200 text-zinc-600",
  withdrawn: "bg-zinc-200 text-zinc-600",
};

interface InboxTableProps {
  status?: SubmissionStatus;
  jobId?: string;
}

export function InboxTable({ status, jobId }: InboxTableProps) {
  const submissions = useSubmissions({ limit: 50, status, jobId });
  // Submissions carry only jobId. One jobs fetch builds a lookup, rather than a
  // request per row.
  const jobs = useJobs({ limit: 100 });
  const jobTitles = new Map(
    jobs.data?.data.map((job) => [job.id, job.title]) ?? [],
  );

  if (submissions.isPending) {
    return <p className="text-sm text-muted-foreground">Loading inbox…</p>;
  }

  if (submissions.isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load submissions.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void submissions.refetch()}
        >
          Retry
        </button>
      </p>
    );
  }

  if (submissions.data.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No submissions yet. Recruiters can only submit to{" "}
        <Link href="/company/jobs" className="underline">
          published jobs
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Received</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {submissions.data.data.map((submission) => (
            <tr key={submission.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">
                {jobTitles.get(submission.jobId) ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {submission.createdAt.toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[submission.status]
                  }`}
                >
                  {SUBMISSION_STATUS_LABELS[submission.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/company/inbox/${submission.id}`}
                  className="underline"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
