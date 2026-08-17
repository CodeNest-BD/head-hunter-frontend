"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { useDeleteAdminJob } from "../hooks/useAdmin";

/**
 * Per-row admin actions on a job: a 3-dot menu with Edit (→ the admin job
 * editor) and Delete (soft-delete, behind a confirmation). Admins can act on
 * any company's job.
 */
export function JobRowActions({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteJob = useDeleteAdminJob();

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
            className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-card-lg"
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
            <Dropdown.Item
              onSelect={(event) => {
                event.preventDefault();
                setConfirmOpen(true);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete job
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-card-lg focus:outline-none">
            <AlertDialog.Title className="font-heading text-lg font-extrabold text-foreground">
              Delete this job?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              &ldquo;{jobTitle}&rdquo; will be removed and any reserved fee
              released back to the company. This is recoverable by support.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteJob.isPending}
                onClick={() =>
                  deleteJob.mutate(jobId, {
                    onSuccess: () => setConfirmOpen(false),
                  })
                }
              >
                {deleteJob.isPending ? "Deleting…" : "Delete job"}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
