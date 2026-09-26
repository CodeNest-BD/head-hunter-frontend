"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { useDeleteAdminJob, useRepostAdminJob } from "../hooks/useAdmin";
import type { JobStatus } from "../schemas";

/** Which confirmation is open — the actions are mutually exclusive. */
type PendingAction = "delete" | "repost" | null;

/**
 * Per-row admin actions on a job: a 3-dot menu with Edit (→ the admin job
 * editor), Re-post (expired listings only) and Delete, each destructive/
 * outward-facing action behind a confirmation. Admins can act on any
 * company's job.
 */
export function JobRowActions({
  jobId,
  jobTitle,
  status,
}: {
  jobId: string;
  jobTitle: string;
  status: JobStatus;
}) {
  const [pending, setPending] = useState<PendingAction>(null);
  const deleteJob = useDeleteAdminJob();
  const repostJob = useRepostAdminJob();

  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${jobTitle}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-card-lg"
          >
            <Dropdown.Item asChild>
              <Link
                href={`/admin/jobs/${jobId}/edit`}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none hover:bg-accent focus:bg-accent"
              >
                <Pencil className="h-4 w-4" />
                Edit job
              </Link>
            </Dropdown.Item>
            {status === "expired" && (
              <Dropdown.Item
                onSelect={(event) => {
                  event.preventDefault();
                  setPending("repost");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none hover:bg-accent focus:bg-accent"
              >
                <RotateCcw className="h-4 w-4" />
                Re-post job
              </Dropdown.Item>
            )}
            <Dropdown.Item
              onSelect={(event) => {
                event.preventDefault();
                setPending("delete");
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete job
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>

      <ConfirmActionDialog
        open={pending === "delete"}
        onOpenChange={(open) => setPending(open ? "delete" : null)}
        title="Delete this job?"
        description={`“${jobTitle}” will be removed and any reserved fee released back to the company. This is recoverable by support.`}
        confirmLabel="Delete job"
        pendingLabel="Deleting…"
        destructive
        isPending={deleteJob.isPending}
        onConfirm={() =>
          deleteJob.mutate(jobId, { onSuccess: () => setPending(null) })
        }
      />
      <ConfirmActionDialog
        open={pending === "repost"}
        onOpenChange={(open) => setPending(open ? "repost" : null)}
        title="Re-post this job?"
        description={`“${jobTitle}” goes live again for 30 days on the company's behalf. The recruiter fee is re-checked against the current floor and the company's funds.`}
        confirmLabel="Re-post job"
        pendingLabel="Re-posting…"
        isPending={repostJob.isPending}
        onConfirm={() =>
          repostJob.mutate(jobId, { onSuccess: () => setPending(null) })
        }
      />
    </>
  );
}
