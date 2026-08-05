"use client";

import { useState } from "react";

import { RequireRole } from "@/features/auth";
import {
  InboxTable,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  type SubmissionStatus,
} from "@/features/submissions";
import { Label } from "@/shared/ui-components/controls/label";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function CompanyInboxPage() {
  const [status, setStatus] = useState<SubmissionStatus | "">("");

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              Candidates recruiters have submitted to your jobs.
            </p>
          </header>

          <div className="flex flex-col gap-2">
            <Label htmlFor="status" className="text-foreground">
              Status
            </Label>
            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as SubmissionStatus | "")
              }
              className="h-9 max-w-xs rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
