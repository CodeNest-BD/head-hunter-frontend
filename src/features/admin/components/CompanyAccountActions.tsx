"use client";

import { useState, type ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Ban,
  BadgeCheck,
  BadgeX,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL_PADDED,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";
import {
  useDecideCompanyVerification,
  useReinstateAccount,
  useSuspendAccount,
} from "../hooks/useAdmin";
import type { CompanyDetail } from "../schemas";

/** Only one of these can be on screen, so it is a union, not two booleans. */
type OpenDialog = "none" | "approval" | "hold";

const MENU_CLASS =
  "z-50 min-w-[210px] rounded-sm border border-line bg-surface p-1 shadow-pop";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none transition-colors hover:bg-surface-sub focus:bg-surface-sub [&_svg]:size-[15px] [&_svg]:shrink-0";

const STACK_BUTTON = "h-9 w-full justify-start px-3 text-sub font-medium";

/**
 * Approve/decline and suspend/reinstate for a company, in the two shapes the
 * profile needs: the header's kebab and the sidebar's disclosure. Defined once
 * so the two can never offer different things.
 *
 * Companies have no delete — there is no endpoint for it, unlike recruiters.
 */
export function CompanyAccountActions({
  data,
  presentation,
}: {
  data: CompanyDetail;
  presentation: "menu" | "stack";
}) {
  const [open, setOpen] = useState<OpenDialog>("none");
  const [note, setNote] = useState("");

  const decide = useDecideCompanyVerification();
  const suspend = useSuspendAccount();
  const reinstate = useReinstateAccount();

  const isHeld = data.status === "suspended";
  const declining = data.verificationStatus === "verified";
  const holdPending = suspend.isPending || reinstate.isPending;
  const close = (): void => setOpen("none");

  const submitApproval = (): void => {
    decide.mutate(
      {
        userId: data.userId,
        status: declining ? "rejected" : "verified",
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNote("");
          close();
        },
      },
    );
  };

  const submitHold = async (): Promise<void> => {
    try {
      if (isHeld) {
        await reinstate.mutateAsync(data.userId);
        toast.success("Account reinstated", {
          description: `${data.companyName} can sign in again.`,
        });
      } else {
        await suspend.mutateAsync({ userId: data.userId });
        toast.success("Account suspended", {
          description: `${data.companyName} has been signed out and blocked.`,
        });
      }
      close();
    } catch {
      toast.error("Action failed", { description: "Please try again." });
    }
  };

  const actions = [
    {
      key: "approval",
      label: declining ? "Decline company" : "Approve company",
      icon: declining ? <BadgeX /> : <BadgeCheck />,
      destructive: declining,
    },
    {
      key: "hold",
      label: isHeld ? "Reinstate account" : "Suspend company",
      icon: isHeld ? <ShieldCheck /> : <Ban />,
      destructive: !isHeld,
    },
  ] as const;

  return (
    <>
      {presentation === "menu" ? (
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`More actions for ${data.companyName}`}
            >
              <MoreHorizontal />
            </Button>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content align="end" sideOffset={6} className={MENU_CLASS}>
              {actions.map((action) => (
                <Dropdown.Item
                  key={action.key}
                  onSelect={(event) => {
                    // The dialog replaces the menu, so the menu must not also
                    // steal focus back as it closes.
                    event.preventDefault();
                    setOpen(action.key);
                  }}
                  className={cn(
                    action.destructive &&
                      "text-bad hover:bg-bad-bg focus:bg-bad-bg",
                    ITEM_CLASS,
                  )}
                >
                  {action.icon}
                  {action.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2">
          {actions.map((action) => (
            <Button
              key={action.key}
              type="button"
              variant={action.destructive ? "destructive" : "outline"}
              className={STACK_BUTTON}
              onClick={() => setOpen(action.key)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <Confirm
        open={open === "approval"}
        onOpenChange={(next) => !next && close()}
        title={
          declining
            ? `Decline ${data.companyName}?`
            : `Approve ${data.companyName}?`
        }
        description={
          declining
            ? "They lose the ability to post jobs until they are approved again."
            : "They can post jobs and fund their wallet."
        }
        confirmLabel={declining ? "Decline company" : "Approve company"}
        destructive={declining}
        pending={decide.isPending}
        onConfirm={submitApproval}
      >
        {data.verificationNote && (
          <p className="mt-3 rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-sub text-ink-body">
            <span className="font-[650] text-ink">Last note:</span>{" "}
            {data.verificationNote}
          </p>
        )}
        <Textarea
          className="mt-3"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note — sent to the company with the decision."
          aria-label="Approval note"
        />
      </Confirm>

      <Confirm
        open={open === "hold"}
        onOpenChange={(next) => !next && close()}
        title={
          isHeld
            ? `Reinstate ${data.companyName}?`
            : `Suspend ${data.companyName}?`
        }
        description={
          isHeld
            ? "They will be able to sign in and use the platform again."
            : "They will be signed out immediately and blocked from signing in until reinstated."
        }
        confirmLabel={isHeld ? "Reinstate account" : "Suspend company"}
        destructive={!isHeld}
        pending={holdPending}
        onConfirm={() => void submitHold()}
      />
    </>
  );
}

/** The alert-dialog shell these actions share. */
function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={DIALOG_OVERLAY} />
        <AlertDialog.Content className={cn(DIALOG_PANEL_PADDED, "max-w-md")}>
          <AlertDialog.Title className={DIALOG_TITLE}>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sub text-ink-muted">
            {description}
          </AlertDialog.Description>
          {children}
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
