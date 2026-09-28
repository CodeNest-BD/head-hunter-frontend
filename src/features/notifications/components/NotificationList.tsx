"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  BellOff,
  Briefcase,
  Check,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  ShieldX,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { Card } from "@/shared/ui-components/controls/card";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ListRow } from "@/shared/ui-components/list/ListRow";
import { Tile, type TileTone } from "@/shared/ui-components/list/Tile";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatTime } from "@/shared/utils/formatDate";
import type { Notification } from "../schemas";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/useNotifications";
import { notificationHref } from "../utils/notificationHref";

const PAGE_SIZE = 50;

type Category = "jobs" | "candidates" | "account" | "other";
type Filter = "all" | "unread" | "jobs" | "candidates" | "account";

/**
 * Bucket a free-string type into one of the reference's filter groups. Substring
 * matching keeps it resilient as the backend adds types.
 */
function categoryOf(type: string): Category {
  const t = type.toLowerCase();
  if (t.includes("job")) return "jobs";
  if (
    t.includes("candidate") ||
    t.includes("submission") ||
    t.includes("hire") ||
    t.includes("offer") ||
    t.includes("interview")
  ) {
    return "candidates";
  }
  if (
    t.includes("verif") ||
    t.includes("account") ||
    t.includes("follow") ||
    t.includes("subscription") ||
    t.includes("payout") ||
    t.includes("placement") ||
    t.includes("dispute") ||
    t.includes("wallet")
  ) {
    return "account";
  }
  return "other";
}

/** Icon + tile tone for a notification, derived from its type. */
function iconFor(type: string): { Icon: LucideIcon; tone: TileTone } {
  const t = type.toLowerCase();
  if (t.includes("verif")) {
    return t.includes("reject") || t.includes("declin")
      ? { Icon: ShieldX, tone: "bad" }
      : { Icon: ShieldCheck, tone: "ok" };
  }
  if (t.includes("message") || t.includes("chat")) {
    return { Icon: MessageSquare, tone: "blue" };
  }
  if (categoryOf(type) === "candidates") {
    return { Icon: UserCheck, tone: "blue" };
  }
  if (t.includes("job")) {
    return { Icon: Briefcase, tone: "blue" };
  }
  return { Icon: Bell, tone: "neutral" };
}

/** "Today" / "Yesterday" / "Aug 19" — the day-header label for a date. */
function dayLabel(date: Date, now: Date): string {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DayGroup {
  readonly label: string;
  readonly items: readonly Notification[];
}

/** Group an already-newest-first list into ordered day buckets. */
function groupByDay(items: readonly Notification[], now: Date): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: { label: string; items: Notification[] } | null = null;
  for (const item of items) {
    const label = dayLabel(item.createdAt, now);
    if (!current || current.label !== label) {
      current = { label, items: [item] };
      groups.push(current);
    } else {
      current.items.push(item);
    }
  }
  return groups;
}

function NotificationRow({
  item,
  onOpen,
  onMarkRead,
  isMarkingRead,
}: {
  item: Notification;
  onOpen: (id: string) => void;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  const { user } = useAuth();
  const href = user ? notificationHref(item, user.role) : null;
  const unread = item.readAt === null;
  const { Icon, tone } = iconFor(item.type);

  // The link and the mark-read button are siblings, never nested: a <button>
  // inside an <a> is invalid markup and clicking it would navigate the row.
  const bodyClassName = "flex min-w-0 flex-1 items-start gap-[11px]";

  const content = (
    <>
      <Tile icon={Icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "flex h-5 items-center text-body text-ink",
            unread ? "font-[650]" : "font-[550]",
          )}
        >
          {item.title}
        </p>
        {item.body && (
          <p className="mt-[2px] text-sub text-ink-muted">{item.body}</p>
        )}
      </div>
    </>
  );

  return (
    <ListRow unread={unread} interactive={href !== null}>
      {href ? (
        <Link
          href={href}
          className={bodyClassName}
          onClick={() => onOpen(item.id)}
        >
          {content}
        </Link>
      ) : (
        <div className={bodyClassName}>{content}</div>
      )}
      {/* Time, unread dot and the mark-read control share one cluster on the
          first text line. Every slot keeps its width when empty, so the
          timestamps stay in a column whether a row is read or unread. */}
      <div className="flex shrink-0 items-start gap-2">
        <span className="flex h-5 items-center text-meta tabular-nums text-ink-faint">
          {formatTime(item.createdAt)}
        </span>
        <span className="flex h-5 w-2 items-center justify-center">
          {unread && (
            <span aria-label="Unread" className="size-2 rounded-full bg-blue" />
          )}
        </span>
        {unread ? (
          <button
            type="button"
            title="Mark as read"
            aria-label={`Mark "${item.title}" as read`}
            disabled={isMarkingRead}
            onClick={() => onMarkRead(item.id)}
            className="flex size-5 items-center justify-center rounded-xs text-ink-faint transition-colors hover:text-blue disabled:opacity-40"
          >
            <Check className="size-[15px]" />
          </button>
        ) : (
          <span aria-hidden="true" className="size-5" />
        )}
      </div>
    </ListRow>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full animate-pulse rounded-md border border-line bg-surface-sub"
        />
      ))}
    </div>
  );
}

export function NotificationList() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isPending, isError, refetch } = useNotifications({
    page: 1,
    limit: PAGE_SIZE,
    unreadOnly: filter === "unread",
  });
  const unreadCount = useUnreadCount().data ?? 0;
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const chips: readonly { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    {
      key: "unread",
      label: unreadCount > 0 ? `Unread · ${unreadCount}` : "Unread",
    },
    { key: "jobs", label: "Jobs" },
    { key: "candidates", label: "Candidates" },
    { key: "account", label: "Account" },
  ];

  const rows = data?.data ?? [];
  const visible =
    filter === "jobs" || filter === "candidates" || filter === "account"
      ? rows.filter((n) => categoryOf(n.type) === filter)
      : rows;
  const groups = groupByDay(visible, new Date());

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notifications"
        subtitle="Updates on your jobs, candidates and conversations."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={markAllRead.isPending || unreadCount === 0}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck />
            Mark all read
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              active={filter === chip.key}
              onClick={() => setFilter(chip.key)}
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>

        {isPending && <ListSkeleton />}

        {isError && (
          <div className="flex flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg px-3.5 py-[11px] text-sub text-bad">
            <div className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px]" />
              Could not load notifications.
            </div>
            <button
              type="button"
              className="self-start rounded-xs border border-bad-line px-2.5 py-1 text-meta font-[550] transition-colors hover:bg-bad-bg"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {data && visible.length === 0 && (
          <Card>
            <EmptyState
              icon={BellOff}
              title={filter === "all" ? "Nothing yet" : "Nothing here"}
              description={
                filter === "all"
                  ? "You will hear here as your jobs and candidates move."
                  : "No notifications match this filter."
              }
            />
          </Card>
        )}

        {data &&
          groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <h2 className="px-1 text-label font-[650] uppercase text-ink-muted">
                {group.label}
              </h2>
              <Card className="overflow-hidden">
                <ul className="flex flex-col">
                  {group.items.map((item) => (
                    // The row's own hairline sits on the `<li>`: `ListRow`'s
                    // `last:` rule can never fire while each row is an only
                    // child.
                    <li
                      key={item.id}
                      className="border-b border-line last:border-b-0"
                    >
                      <NotificationRow
                        item={item}
                        onOpen={(id) => markRead.mutate(id)}
                        onMarkRead={(id) => markRead.mutate(id)}
                        isMarkingRead={markRead.isPending}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
      </div>
    </div>
  );
}
