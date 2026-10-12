"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Ban,
  BadgeCheck,
  BadgeX,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
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
  useDecideRecruiterVerification,
  useDeleteRecruiter,
  useReinstateAccount,
  useSuspendAccount,
} from "../hooks/useAdmin";
import type { RecruiterDetail } from "../schemas";

/**
 * Which action's dialog is open. A union rather than three booleans — only
 * one of these can be on screen, and three flags can represent states that
 * cannot happen.
 */
type OpenDialog = "none" | "verification" | "hold" | "delete";

const MENU_CLASS =
  "z-50 min-w-[210px] rounded-sm border border-line bg-surface p-1 shadow-pop";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none transition-colors hover:bg-surface-sub focus:bg-surface-sub [&_svg]:size-[15px] [&_svg]:shrink-0";

/** The stacked form's one button shape. */
const STACK_BUTTON = "h-9 w-full justify-start px-3 text-sub font-medium";

interface RecruiterAccountActionsProps {
  data: RecruiterDetail;
  /**
   * `menu` is the header's kebab; `stack` is the sidebar's disclosure. Both
   * drive the same three dialogs — the actions are defined once here so the
   * two presentations can never offer different things.
   */
  presentation: "menu" | "stack";
}

export function RecruiterAccountActions({
  data,
  presentation,
}: RecruiterAccountActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState<OpenDialog>("none");
  const [note, setNote] = useState("");

  const decide = useDecideRecruiterVerification();
  const suspend = useSuspendAccount();
  const reinstate = useReinstateAccount();
  const remove = useDeleteRecruiter();

  const name = `${data.firstName} ${data.lastName}`;
  const isHeld = data.status === "suspended";
  // A verified recruiter can only have it taken away; anything else is an
  // approval, including re-approving one who was rejected.
  const revoking = data.verificationStatus === "verified";
  const holdPending = suspend.isPending || reinstate.isPending;

  const close = (): void => setOpen("none");

  const submitVerification = (): void => {
    decide.mutate(
      {
        userId: data.userId,
        status: revoking ? "rejected" : "verified",
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
          description: `${name} can sign in again.`,
        });
      } else {
        await suspend.mutateAsync({ userId: data.userId });
        toast.success("Account suspended", {
          description: `${name} has been signed out and blocked.`,
        });
      }
      close();
    } catch {
      toast.error("Action failed", { description: "Please try again." });
    }
  };

  const actions = [
    {
      key: "verification",
      label: revoking ? "Revoke verification" : "Approve verification",
      icon: revoking ? <BadgeX /> : <BadgeCheck />,
      destructive: revoking,
    },
    {
      key: "hold",
      label: isHeld ? "Reinstate account" : "Suspend account",
      icon: isHeld ? <ShieldCheck /> : <Ban />,
      destructive: !isHeld,
    },
    {
      key: "delete",
      label: "Delete recruiter",
      icon: <Trash2 />,
      destructive: true,
    },
  ] as const;

  const trigger =
    presentation === "menu" ? (
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`More actions for ${name}`}
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
                  ITEM_CLASS,
                  action.destructive &&
                    "text-bad hover:bg-bad-bg focus:bg-bad-bg",
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
    );

  return (
    <>
      {trigger}

      <Confirm
        open={open === "verification"}
        onOpenChange={(next) => !next && close()}
        title={
          revoking
            ? `Revoke ${data.firstName}'s verification?`
            : `Approve ${data.firstName}?`
        }
        description={
          revoking
            ? "They lose the live job map and cannot submit candidates until they are approved again."
            : "They get the live job map and can submit candidates."
        }
        confirmLabel={revoking ? "Revoke verification" : "Approve recruiter"}
        destructive={revoking}
        pending={decide.isPending}
        onConfirm={submitVerification}
      >
        {data.verificationNote && (
          /* The previous decision, kept as context beside the new one. */
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
          placeholder="Optional note — sent to the recruiter with the decision."
          aria-label="Verification note"
        />
      </Confirm>

      <Confirm
        open={open === "hold"}
        onOpenChange={(next) => !next && close()}
        title={isHeld ? `Reinstate ${name}?` : `Suspend ${name}?`}
        description={
          isHeld
            ? "They will be able to sign in and use the platform again."
            : "They will be signed out immediately and blocked from signing in until reinstated."
        }
        confirmLabel={isHeld ? "Reinstate account" : "Suspend account"}
        destructive={!isHeld}
        pending={holdPending}
        onConfirm={() => void submitHold()}
      />

      <Confirm
        open={open === "delete"}
        onOpenChange={(next) => !next && close()}
        title={`Delete ${name}?`}
        description="The recruiter account is removed and its sessions revoked. This is recoverable by support."
        confirmLabel="Delete recruiter"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(data.userId, {
            onSuccess: () => {
              close();
              router.push("/admin/recruiters");
            },
          })
        }
      />
    </>
  );
}

/** The one alert-dialog shell these three actions share. */
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
  /** Extra fields above the buttons, e.g. the verification note. */
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
