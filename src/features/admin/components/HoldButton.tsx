"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/libs/shadCnConfig";
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
 * Hold / reinstate an account behind a confirmation dialog — suspension is
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
        toast.success("Account held", {
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
          variant="outline"
          className={cn(
            !isHeld &&
              "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          {isHeld ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {isHeld ? "Reinstate" : "Hold"}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-card-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="font-heading text-lg font-bold text-navy">
            {isHeld ? `Reinstate ${subjectName}?` : `Hold ${subjectName}?`}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {isHeld
              ? "They will be able to sign in and use the platform again."
              : "They will be signed out immediately and blocked from signing in until reinstated."}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
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
                  : "Hold account"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
