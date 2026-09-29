"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Ban, Eye, MoreVertical, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import {
  useDeleteRecruiter,
  useReinstateAccount,
  useSuspendAccount,
} from "../hooks/useAdmin";
import type { AccountStatus } from "../schemas";
import {
  DIALOG_OVERLAY,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";

interface AccountRowActionsProps {
  userId: string;
  status: AccountStatus;
  subjectName: string;
  viewHref: string;
  /** Recruiters can also be deleted; companies cannot (no endpoint). */
  kind: "company" | "recruiter";
}

/** The reference's `.kebab` — a 28px quiet trigger sized for a 44px row. */
const KEBAB_CLASS =
  "inline-flex size-7 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const MENU_CLASS =
  "z-50 min-w-[170px] rounded-sm border border-line bg-surface p-1 shadow-pop";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none transition-colors hover:bg-surface-sub focus:bg-surface-sub [&_svg]:size-[15px] [&_svg]:shrink-0";

/** The alert dialog shell, matching `ConfirmActionDialog`'s popover recipe. */
const DIALOG_CLASS =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-5 shadow-pop focus:outline-none";

/**
 * The single 3-dot row menu for account tables (companies, recruiters):
 * View, Suspend/Reinstate, and — for recruiters — Delete. Destructive actions
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
  // "Suspend" for every account type (companies and recruiters alike).
  const holdLabel = "Suspend";
  const heldLabel = "suspended";

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
              className={KEBAB_CLASS}
            >
              <MoreVertical className="size-[17px]" />
            </button>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content align="end" sideOffset={4} className={MENU_CLASS}>
              <Dropdown.Item asChild>
                <Link href={viewHref} className={ITEM_CLASS}>
                  <Eye className="text-ink-faint" />
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
                  <ShieldCheck className="text-ink-faint" />
                ) : (
                  <Ban className="text-ink-faint" />
                )}
                {isHeld ? "Reinstate" : holdLabel}
              </Dropdown.Item>
              {kind === "recruiter" && (
                <Dropdown.Item
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteOpen(true);
                  }}
                  className={cn(
                    ITEM_CLASS,
                    "text-bad hover:bg-bad-bg focus:bg-bad-bg",
                  )}
                >
                  <Trash2 />
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
          <AlertDialog.Overlay className={DIALOG_OVERLAY} />
          <AlertDialog.Content className={DIALOG_CLASS}>
            <AlertDialog.Title className={DIALOG_TITLE}>
              {isHeld
                ? `Reinstate ${subjectName}?`
                : `${holdLabel} ${subjectName}?`}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-sub text-ink-muted">
              {isHeld
                ? "They will be able to sign in and use the platform again."
                : "They will be signed out immediately and blocked until reinstated."}
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
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
            <AlertDialog.Overlay className={DIALOG_OVERLAY} />
            <AlertDialog.Content className={DIALOG_CLASS}>
              <AlertDialog.Title className={DIALOG_TITLE}>
                Delete {subjectName}?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1.5 text-sub text-ink-muted">
                The recruiter account is removed and its sessions revoked. This
                is recoverable by support.
              </AlertDialog.Description>
              <div className="mt-4 flex justify-end gap-2">
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
