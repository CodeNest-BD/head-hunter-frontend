"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { Button } from "@/shared/ui-components/controls/button";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Shown on the confirm button while the mutation runs. */
  pendingLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * The confirmation gate in front of every destructive or outward-facing admin
 * action (delete, re-post, bulk variants) — one styling and focus behavior
 * instead of a hand-rolled AlertDialog per action.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = false,
  isPending,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-6 shadow-card-lg focus:outline-none">
          <AlertDialog.Title className="font-heading text-lg font-extrabold text-foreground">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
