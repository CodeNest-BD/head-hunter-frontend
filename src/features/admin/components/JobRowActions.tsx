"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { adminJobEditPath } from "@/shared/utils/entityPaths";
import { ConfirmActionDialog } from "@/shared/ui-components/controls/ConfirmActionDialog";

import { useDeleteAdminJob, useRepostAdminJob } from "../hooks/useAdmin";
import type { JobStatus } from "../schemas";

/** Which confirmation is open — the actions are mutually exclusive. */
type PendingAction = "delete" | "repost" | null;

/** The reference's `.kebab` — a 28px quiet trigger sized for a 44px row. */
const KEBAB_CLASS =
  "inline-flex size-7 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none transition-colors hover:bg-surface-sub focus:bg-surface-sub [&_svg]:size-[15px] [&_svg]:shrink-0";

/**
 * Per-row admin actions on a job: a 3-dot menu with Edit (→ the admin job
 * editor), Re-post (expired listings only) and Delete, each destructive/
 * outward-facing action behind a confirmation. Admins can act on any
 * company's job.
 */
export function JobRowActions({
  jobId,
  jobSerialNumber,
  jobTitle,
  status,
}: {
  jobId: string;
  jobSerialNumber?: number;
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
            className={KEBAB_CLASS}
          >
            <MoreVertical className="size-[17px]" />
          </button>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[160px] rounded-sm border border-line bg-surface p-1 shadow-pop"
          >
            {status !== "filled" && (
              <Dropdown.Item asChild>
                <Link
                  href={adminJobEditPath({
                    id: jobId,
                    serialNumber: jobSerialNumber,
                  })}
                  className={ITEM_CLASS}
                >
                  <Pencil className="text-ink-faint" />
                  Edit job
                </Link>
              </Dropdown.Item>
            )}
            {status === "expired" && (
              <Dropdown.Item
                onSelect={(event) => {
                  event.preventDefault();
                  setPending("repost");
                }}
                className={ITEM_CLASS}
              >
                <RotateCcw className="text-ink-faint" />
                Re-post job
              </Dropdown.Item>
            )}
            <Dropdown.Item
              onSelect={(event) => {
                event.preventDefault();
                setPending("delete");
              }}
              className={cn(
                ITEM_CLASS,
                "text-bad hover:bg-bad-bg focus:bg-bad-bg",
              )}
            >
              <Trash2 />
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
