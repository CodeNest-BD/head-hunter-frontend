"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Ban, Eye, MoreVertical, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui-components/controls/button";
import {
  useDeleteRecruiter,
  useReinstateAccount,
  useSuspendAccount,
} from "../hooks/useAdmin";
import type { AccountStatus } from "../schemas";

interface AccountRowActionsProps {
  userId: string;
  status: AccountStatus;
  subjectName: string;
  viewHref: string;
  /** Recruiters can also be deleted; companies cannot (no endpoint). */
  kind: "company" | "recruiter";
}

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none hover:bg-accent focus:bg-accent";

/**
 * The single 3-dot row menu for account tables (companies, recruiters):
 * View, Hold/Reinstate, and — for recruiters — Delete. Destructive actions
 * confirm in an alert dialog, so the menu item only opens the dialog.
 */
export function AccountRowActions({
  userId,
  status,
  subjectName,
  viewHref,
  kind,
}: AccountRowActionsProps) {
  const [holdOpen, setHoldOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const suspend = useSuspendAccount();
  const reinstate = useReinstateAccount();
  const deleteRecruiter = useDeleteRecruiter();
  const isHeld = status === "suspended";
  const holdPending = suspend.isPending || reinstate.isPending;
  // Companies are "suspended"; recruiters are "held" — same action, clearer word
  // for each audience.
  const holdLabel = kind === "company" ? "Suspend" : "Hold";
  const heldLabel = kind === "company" ? "suspended" : "held";

  const confirmHold = async (): Promise<void> => {
    try {
      if (isHeld) {
        await reinstate.mutateAsync(userId);
        toast.success("Account reinstated", {
          description: `${subjectName} can sign in again.`,
        });
      } else {
        await suspend.mutateAsync({ userId });
        toast.success(`Account ${heldLabel}`, {
          description: `${subjectName} has been signed out and blocked.`,
        });
      }
      setHoldOpen(false);
    } catch {
      toast.error("Action failed", { description: "Please try again." });
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${subjectName}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[170px] rounded-md border border-border bg-popover p-1 shadow-card-lg"
            >
              <Dropdown.Item asChild>
                <Link href={viewHref} className={ITEM_CLASS}>
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </Dropdown.Item>
              <Dropdown.Item
                onSelect={(event) => {
                  event.preventDefault();
                  setHoldOpen(true);
                }}
                className={ITEM_CLASS}
              >
                {isHeld ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                {isHeld ? "Reinstate" : holdLabel}
              </Dropdown.Item>
              {kind === "recruiter" && (
                <Dropdown.Item
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteOpen(true);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Dropdown.Item>
              )}
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </div>

      {/* Hold / reinstate confirm */}
      <AlertDialog.Root open={holdOpen} onOpenChange={setHoldOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-6 shadow-card-lg focus:outline-none">
            <AlertDialog.Title className="font-heading text-lg font-extrabold text-navy">
              {isHeld
                ? `Reinstate ${subjectName}?`
                : `${holdLabel} ${subjectName}?`}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {isHeld
                ? "They will be able to sign in and use the platform again."
                : "They will be signed out immediately and blocked until reinstated."}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={holdPending}>
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                variant={isHeld ? "default" : "destructive"}
                disabled={holdPending}
                onClick={() => void confirmHold()}
              >
                {holdPending
                  ? "Working…"
                  : isHeld
                    ? "Reinstate account"
                    : `${holdLabel} account`}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Delete confirm (recruiters only) */}
      {kind === "recruiter" && (
        <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-6 shadow-card-lg focus:outline-none">
              <AlertDialog.Title className="font-heading text-lg font-extrabold text-foreground">
                Delete {subjectName}?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                The recruiter account is removed and its sessions revoked. This
                is recoverable by support.
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteRecruiter.isPending}
                  onClick={() =>
                    deleteRecruiter.mutate(userId, {
                      onSuccess: () => setDeleteOpen(false),
                    })
                  }
                >
                  {deleteRecruiter.isPending ? "Deleting…" : "Delete recruiter"}
                </Button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </>
  );
}
