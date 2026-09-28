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
        className="hidden h-8.5 items-center gap-1.5 whitespace-nowrap rounded-sm border border-line-strong bg-surface px-3 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-sub lg:inline-flex"
      >
        <span className="text-ink-muted">Available</span>
        <span className="tabular-nums">
          {formatMinor(data?.availableMinor)}
        </span>
      </Link>
      <Link
        href="/company/jobs/new"
        aria-label="Post a Job"
        className="inline-flex h-7.5 items-center justify-center gap-[7px] rounded-xs bg-blue px-2.5 text-[12.5px] font-semibold text-white shadow-e1 transition-colors hover:bg-blue-deep"
      >
        <Plus className="size-[15px]" strokeWidth={2.2} />
        <span className="hidden sm:inline">Post a Job</span>
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
      className="hidden h-8.5 items-center gap-1.5 whitespace-nowrap rounded-sm border border-line-strong bg-surface px-3 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-sub lg:inline-flex"
    >
      <span className="text-ink-muted">Commission</span>
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
          className="relative flex size-8.5 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink"
        >
          <Bell className="size-[17px]" />
          {count > 0 && (
            <span className="absolute right-[5px] top-[5px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-surface bg-bad px-1 text-[9.5px] font-bold leading-none text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[24rem] max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-card font-[650] text-ink">Notifications</p>
            <p className="text-meta text-ink-muted">
              {count > 0
                ? `You have ${count} unread notification${count === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="shrink-0 text-meta font-semibold text-blue-ink transition-colors hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[24rem] overflow-y-auto">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-10 text-ink-faint">
              <Loader2 className="size-[17px] animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sub text-ink-muted">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const href = user ? notificationHref(item, user.role) : null;
                const isUnread = !item.readAt;
                const onSelect = () => {
                  if (isUnread) markRead.mutate(item.id);
                  setOpen(false);
                };
                const body = (
                  <div className="flex items-start gap-2 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sub text-ink",
                          isUnread ? "font-[650]" : "font-[450]",
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-meta text-ink-faint">
                        {formatDistanceToNow(item.createdAt, {
                          addSuffix: true,
                        })}
                        {href && <ExternalLink className="size-3" />}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1.5 size-[7px] shrink-0 rounded-full bg-blue" />
                    )}
                  </div>
                );
                return (
                  <li key={item.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={onSelect}
                        className="block transition-colors hover:bg-surface-sub"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={onSelect}
                        className="block w-full text-left transition-colors hover:bg-surface-sub"
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
      {role === "company" ? (
        <CompanyTopBarActions />
      ) : (
        <RecruiterTopBarActions />
      )}
      <NotificationBell />
    </>
  );
}
