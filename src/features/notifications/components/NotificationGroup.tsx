"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  ShieldX,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/features/auth";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDateTime } from "@/shared/utils/formatDate";
import {
  useMarkRead,
  useMarkUnread,
  useNotifications,
} from "../hooks/useNotifications";
import { notificationHref } from "../utils/notificationHref";
import type {
  Notification,
  NotificationGroup as NotificationGroupData,
} from "../schemas";

interface NotificationGroupProps {
  group: NotificationGroupData;
  role: Role;
}

interface NotificationRowProps {
  item: Notification;
  role: Role;
  onOpen: (id: string) => void;
}

/**
 * Pick a glyph from the notification's (free-string) type. Substring matching
 * keeps it resilient as the backend adds types — an unmatched type still gets
 * a sensible bell rather than nothing.
 */
function iconFor(type: string): { Icon: LucideIcon; tone: string } {
  const t = type.toLowerCase();
  if (t.includes("verif")) {
    return t.includes("reject") || t.includes("declin")
      ? { Icon: ShieldX, tone: "bg-destructive/10 text-destructive" }
      : { Icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-600" };
  }
  if (t.includes("message") || t.includes("chat")) {
    return { Icon: MessageSquare, tone: "bg-accent text-primary" };
  }
  if (
    t.includes("hire") ||
    t.includes("offer") ||
    t.includes("submission") ||
    t.includes("candidate")
  ) {
    return { Icon: UserCheck, tone: "bg-accent text-primary" };
  }
  if (t.includes("job")) {
    return { Icon: Briefcase, tone: "bg-accent text-primary" };
  }
  return { Icon: Bell, tone: "bg-secondary text-brand-gray" };
}

/**
 * QA fix: a read notification can be flagged back to unread. Rendered outside
 * the row's link so clicking it never navigates.
 */
function MarkUnreadButton({ id }: { id: string }) {
  const markUnread = useMarkUnread();
  return (
    <button
      type="button"
      disabled={markUnread.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        markUnread.mutate(id);
      }}
      className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
    >
      Mark unread
    </button>
  );
}

/**
 * One notification, as a compact list row. A resolvable href renders the row
 * as a link whose click marks it read; an unresolvable one renders identical
 * markup as inert text — a dead link is worse than a row that simply doesn't
 * respond.
 */
function NotificationRow({ item, role, onOpen }: NotificationRowProps) {
  const href = notificationHref(item, role);
  const unread = item.readAt === null;
  const { Icon, tone } = iconFor(item.type);
  const rowClassName = cn(
    "group relative flex items-start gap-3 px-4 py-3.5 transition-colors",
    unread ? "bg-primary/[0.035]" : "hover:bg-secondary/50",
  );

  const content = (
    <>
      {unread && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-[3px] bg-primary"
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          tone,
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm text-navy",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {item.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {!unread && <MarkUnreadButton id={item.id} />}
            {unread && (
              <span
                aria-label="Unread"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              />
            )}
          </div>
        </div>
        {item.body && (
          <p className="mt-0.5 text-sm text-brand-gray">{item.body}</p>
        )}
        <p className="mt-0.5 text-xs tabular-nums text-brand-gray-light">
          {formatDateTime(item.createdAt)}
        </p>
      </div>
    </>
  );

  if (!href) {
    return <div className={rowClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={rowClassName} onClick={() => onOpen(item.id)}>
      {content}
    </Link>
  );
}

/**
 * One conversation's worth of notifications. A group of one — the common
 * case — renders its single item directly with no disclosure chrome: the
 * stacking must not add noise where there is nothing to stack. A group of
 * more shows a header that only expands or collapses; it never navigates
 * and never marks anything read, because opening three items to glance at
 * them should not destroy the fact that only one was actually read.
 *
 * Expanding past the three items the group ships with re-fetches through the
 * flat endpoint, scoped to this submission and cached under its own key, so
 * closing and reopening the same group is served from cache.
 */
export function NotificationGroup({ group, role }: NotificationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const markRead = useMarkRead();
  // Gated on submissionId !== null too: axios drops an undefined param, so
  // without this an expanded group whose submissionId is missing would fire
  // GET /notifications with no filter at all and render every notification
  // the user has, not just this group's.
  const expanded = useNotifications(
    { submissionId: group.submissionId ?? undefined },
    isExpanded && group.submissionId !== null,
  );

  const handleOpen = (id: string): void => {
    markRead.mutate(id);
  };

  if (group.total === 1) {
    const [onlyItem] = group.items;
    if (!onlyItem) {
      return null;
    }
    return <NotificationRow item={onlyItem} role={role} onOpen={handleOpen} />;
  }

  const items = isExpanded ? (expanded.data?.data ?? group.items) : group.items;

  return (
    <div>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? "Collapse notifications" : "Expand notifications"
        }
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
          </span>
          <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            {group.jobTitle && (
              <span className="text-sm font-semibold text-navy">
                {group.jobTitle}
              </span>
            )}
            {group.counterpartyName && (
              <span className="text-sm text-brand-gray">
                · {group.counterpartyName}
              </span>
            )}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {group.unread > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {group.unread} new
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="divide-y divide-border border-t border-border bg-secondary/30 pl-6">
          {items.map((groupItem) => (
            <NotificationRow
              key={groupItem.id}
              item={groupItem}
              role={role}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
