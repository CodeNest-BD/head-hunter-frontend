"use client";

import { Button } from "@/shared/ui-components/controls/button";
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

export function NotificationList() {
  const { data, isPending, isError, refetch } = useNotifications({ limit: 50 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  if (isPending) {
    return (
      <p className="text-sm text-muted-foreground">Loading notifications…</p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load notifications.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </p>
    );
  }

  if (data.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing yet. Follow a company and you will hear when it posts a job.
      </p>
    );
  }

  const hasUnread = data.data.some(
    (notification) => notification.readAt === null,
  );

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
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
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                unread ? "border-zinc-300 bg-white" : "bg-muted/30"
              }`}
            >
              <div className="flex flex-col gap-1">
                <p className={unread ? "font-semibold" : "font-medium"}>
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
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
