"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/features/auth";
import {
  InboxTable,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  type SubmissionStatus,
} from "@/features/submissions";
import { Label } from "@/shared/ui-components/controls/label";

export default function CompanyInboxPage() {
  const [status, setStatus] = useState<SubmissionStatus | "">("");

  return (
    <RequireRole role="company">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Candidates recruiters have submitted to your jobs.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as SubmissionStatus | "")
            }
            className="h-9 max-w-xs rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All statuses</option>
            {SUBMISSION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {SUBMISSION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <InboxTable status={status === "" ? undefined : status} />
      </main>
    </RequireRole>
  );
}
