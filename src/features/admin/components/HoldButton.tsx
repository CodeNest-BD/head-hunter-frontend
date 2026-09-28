"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui-components/controls/button";
import { useReinstateAccount, useSuspendAccount } from "../hooks/useAdmin";
import type { AccountStatus } from "../schemas";

interface HoldButtonProps {
  userId: string;
  status: AccountStatus;
  subjectName: string;
  /** "sm" for table rows, default for detail pages. */
  size?: "sm" | "default";
}

/**
 * Suspend / reinstate an account behind a confirmation dialog — suspension is
 * destructive (it force-logs-out the user), so it always confirms first.
 */
export function HoldButton({
  userId,
  status,
  subjectName,
  size = "default",
}: HoldButtonProps) {
  const [open, setOpen] = useState(false);
  const suspend = useSuspendAccount();
  const reinstate = useReinstateAccount();
  const isHeld = status === "suspended";
  const pending = suspend.isPending || reinstate.isPending;

  const confirm = async (): Promise<void> => {
    try {
      if (isHeld) {
        await reinstate.mutateAsync(userId);
        toast.success("Account reinstated", {
          description: `${subjectName} can sign in again.`,
        });
      } else {
        await suspend.mutateAsync({ userId });
        toast.success("Account suspended", {
          description: `${subjectName} has been signed out and blocked.`,
        });
      }
      setOpen(false);
    } catch {
      toast.error("Action failed", {
        description: "Please try again.",
      });
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <Button
          type="button"
          size={size === "sm" ? "sm" : "default"}
          variant={isHeld ? "outline" : "destructive"}
        >
          {isHeld ? <ShieldCheck /> : <Ban />}
          {isHeld ? "Reinstate" : "Suspend"}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-5 shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="text-card font-[650] text-ink">
            {isHeld ? `Reinstate ${subjectName}?` : `Suspend ${subjectName}?`}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sub text-ink-muted">
            {isHeld
              ? "They will be able to sign in and use the platform again."
              : "They will be signed out immediately and blocked from signing in until reinstated."}
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant={isHeld ? "default" : "destructive"}
              disabled={pending}
              onClick={() => void confirm()}
            >
              {pending
                ? "Working…"
                : isHeld
                  ? "Reinstate account"
                  : "Suspend account"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
