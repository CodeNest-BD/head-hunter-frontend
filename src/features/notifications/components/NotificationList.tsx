"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  BellOff,
  Briefcase,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  ShieldX,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { PageBanner } from "@/shared/ui-components/brand";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
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

/** Icon + tint for a notification, derived from its type. */
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
  if (categoryOf(type) === "candidates") {
    return { Icon: UserCheck, tone: "bg-accent text-primary" };
  }
  if (t.includes("job")) {
    return { Icon: Briefcase, tone: "bg-accent text-primary" };
  }
  return { Icon: Bell, tone: "bg-secondary text-brand-gray" };
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
}: {
  item: Notification;
  onOpen: (id: string) => void;
}) {
  const { user } = useAuth();
  const href = user ? notificationHref(item, user.role) : null;
  const unread = item.readAt === null;
  const { Icon, tone } = iconFor(item.type);

  const rowClassName = cn(
    "relative flex items-start gap-3 px-4 py-3.5 transition-colors",
    unread ? "bg-primary/[0.04]" : "hover:bg-secondary/50",
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
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatTime(item.createdAt)}
            </span>
            {unread && (
              <span
                aria-label="Unread"
                className="h-2 w-2 shrink-0 rounded-full bg-primary"
              />
            )}
          </div>
        </div>
        {item.body && (
          <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
        )}
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

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full animate-pulse rounded-md border border-border/70 bg-muted"
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
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Notifications"
        subtitle="Updates on your jobs, submissions and followed companies."
        actions={
          <button
            type="button"
            disabled={markAllRead.isPending || unreadCount === 0}
            onClick={() => markAllRead.mutate()}
            className="inline-flex items-center gap-2 rounded-md border border-white/30 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
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
          <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-[18px] w-[18px]" />
              Could not load notifications.
            </div>
            <button
              type="button"
              className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {data && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-semibold text-navy">
                {filter === "all" ? "Nothing yet" : "Nothing here"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {filter === "all"
                  ? "Follow a company and you will hear when it posts a job."
                  : "No notifications match this filter."}
              </p>
            </div>
          </div>
        )}

        {data &&
          groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {group.label}
              </h2>
              <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <NotificationRow
                        item={item}
                        onOpen={(id) => markRead.mutate(id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
