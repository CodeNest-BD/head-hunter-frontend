"use client";

import { AlertCircle, BellOff, Check, CheckCheck } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "../hooks/useNotifications";

const formatWhen = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="h-20 w-full animate-pulse rounded-xl border border-border/70 bg-muted"
        />
      ))}
    </ul>
  );
}

export function NotificationList() {
  const { data, isPending, isError, refetch } = useNotifications({ limit: 50 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  if (isPending) {
    return <ListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9D2E3] bg-card px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BellOff className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold text-foreground">
            Nothing yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Follow a company and you will hear when it posts a job.
          </p>
        </div>
      </div>
    );
  }

  const hasUnread = data.data.some(
    (notification) => notification.readAt === null,
  );

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {data.data.map((notification) => {
          const unread = notification.readAt === null;
          return (
            <li
              key={notification.id}
              className={cn(
                "relative flex items-start justify-between gap-4 rounded-xl border p-4 shadow-sm transition-colors",
                unread
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/70 bg-card",
              )}
            >
              {unread && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-4 h-8 w-1 rounded-r-full bg-primary"
                />
              )}
              <div className="flex flex-col gap-1">
                <p
                  className={cn(
                    "text-foreground",
                    unread ? "font-semibold" : "font-medium",
                  )}
                >
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs tabular-nums text-muted-foreground">
                  {formatWhen(notification.createdAt)}
                </p>
              </div>
              {unread && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate(notification.id)}
                >
                  <Check className="h-4 w-4" />
                  Mark read
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
