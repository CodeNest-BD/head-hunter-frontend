"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

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
      className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
    >
      Mark unread
    </button>
  );
}

/**
 * One notification. A resolvable href renders the row as a link whose click
 * marks it read; an unresolvable one (`notificationHref` returned null)
 * renders identical markup as inert text — a dead link is worse than a row
 * that simply doesn't respond.
 */
function NotificationRow({ item, role, onOpen }: NotificationRowProps) {
  const href = notificationHref(item, role);
  const unread = item.readAt === null;
  const rowClassName = cn(
    "group relative flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-colors",
    unread ? "border-primary/40 bg-primary/5" : "border-border/70 bg-card",
  );

  const content = (
    <>
      {unread && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-4 h-8 w-1 rounded-r-full bg-primary"
        />
      )}
      {!unread && <MarkUnreadButton id={item.id} />}
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            "pr-20 text-foreground",
            unread ? "font-semibold" : "font-medium",
          )}
        >
          {item.title}
        </p>
        {item.body && (
          <p className="text-sm text-muted-foreground">{item.body}</p>
        )}
        <p className="text-xs tabular-nums text-muted-foreground">
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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? "Collapse notifications" : "Expand notifications"
        }
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/40"
      >
        <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {group.jobTitle && (
            <span className="font-medium text-foreground">
              {group.jobTitle}
            </span>
          )}
          {group.counterpartyName && (
            <span className="text-sm text-muted-foreground">
              · {group.counterpartyName}
            </span>
          )}
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
        <div className="flex flex-col gap-2 pl-4">
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
