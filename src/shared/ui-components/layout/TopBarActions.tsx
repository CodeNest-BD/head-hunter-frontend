"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, Loader2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useAuth, type Role } from "@/features/auth";
import {
  useRecruiterWallet,
  useWallet,
} from "@/features/billing/hooks/useBilling";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications";
import { notificationHref } from "@/features/notifications/utils/notificationHref";
import { useAccountApproval } from "@/shared/hooks/useAccountApproval";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { formatMinor } from "@/shared/utils/money";

/**
 * Company top-bar actions: the available balance follows you across every page
 * (so you never publish into an empty wallet by surprise) next to Post a job.
 * The balance appears from `lg`, the width at which the top bar stops being
 * the drawer-plus-logo layout — below that the Wallet nav item carries it.
 */
function CompanyTopBarActions() {
  const { data } = useWallet();
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/company/wallet"
        className="hidden items-center gap-1.5 whitespace-nowrap rounded-md border border-input px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-brand-primary hover:text-primary lg:inline-flex"
      >
        <span className="text-muted-foreground">Available</span>
        <span className="tabular-nums">
          {formatMinor(data?.availableMinor)}
        </span>
      </Link>
      <Link
        href="/company/jobs/new"
        aria-label="Post a job"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Post a job</span>
      </Link>
    </div>
  );
}

/**
 * Recruiter top-bar figure: commission released so far this calendar year, the
 * recruiter's counterpart to the company's available balance. Links to the
 * wallet, where the same money is broken down by placement.
 */
function RecruiterTopBarActions() {
  // The wallet endpoint sits behind the approved-account gate, so a pending
  // recruiter must not fetch it — there is no commission to show yet either.
  const { isApproved } = useAccountApproval();
  const { data } = useRecruiterWallet(isApproved);
  if (!isApproved) return null;
  return (
    <Link
      href="/recruiter/wallet"
      title="Commission earned year to date"
      className="hidden items-center gap-1.5 whitespace-nowrap rounded-md border border-input px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-brand-primary hover:text-primary lg:inline-flex"
    >
      <span className="text-muted-foreground">Commission</span>
      <span className="tabular-nums">{formatMinor(data?.earnedYtdMinor)}</span>
    </Link>
  );
}

/**
 * Top-bar notifications: a bell with the unread count that opens a dropdown of
 * recent notifications, so they're read in place rather than on a dedicated
 * route. The list only fetches once the panel is opened.
 */
function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const count = typeof unread === "number" ? unread : 0;
  const list = useNotifications({ limit: 15 }, open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const items = list.data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : "Notifications"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[24rem] max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {count > 0
                ? `You have ${count} unread notification${count === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="shrink-0 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[24rem] overflow-y-auto">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const href = user ? notificationHref(item, user.role) : null;
                const isUnread = !item.readAt;
                const onSelect = () => {
                  if (isUnread) markRead.mutate(item.id);
                  setOpen(false);
                };
                const body = (
                  <div className="flex items-start gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm text-navy",
                          isUnread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(item.createdAt, {
                          addSuffix: true,
                        })}
                        {href && <ExternalLink className="h-3 w-3" />}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
                return (
                  <li key={item.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={onSelect}
                        className="block transition-colors hover:bg-accent"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={onSelect}
                        className="block w-full text-left transition-colors hover:bg-accent"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The signed-in top-bar actions shown to the right of the logo on EVERY page —
 * both the app chrome (DashboardLayout) and the marketing/public chrome
 * (LandingNav) — so a recruiter's commission + notifications, and a company's
 * balance + Post a job + notifications, never disappear when moving between
 * routes. Admins have neither, so this renders nothing for them.
 */
export function TopBarActions({ role }: { role: Role }) {
  if (role !== "company" && role !== "recruiter") return null;
  return (
    <>
      {role === "company" ? <CompanyTopBarActions /> : <RecruiterTopBarActions />}
      <NotificationBell />
    </>
  );
}
