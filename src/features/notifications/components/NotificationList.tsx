"use client";

import { useState } from "react";
import { AlertCircle, BellOff, CheckCheck } from "lucide-react";

import { useAuth } from "@/features/auth";
import { Button } from "@/shared/ui-components/controls/button";
import {
  useMarkAllRead,
  useNotificationGroups,
} from "../hooks/useNotifications";
import { NotificationGroup } from "./NotificationGroup";

const PAGE_SIZE = 20;

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="h-20 w-full animate-pulse rounded-md border border-border/70 bg-muted"
        />
      ))}
    </ul>
  );
}

export function NotificationList() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useNotificationGroups({
    page,
    limit: PAGE_SIZE,
  });
  const markAllRead = useMarkAllRead();

  if (isPending || !user) {
    return <ListSkeleton />;
  }

  if (isError) {
    return (
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
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-[#C9D0DF] bg-card px-6 py-14 text-center">
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

  const hasUnread = data.data.some((group) => group.unread > 0);
  const totalPages = data.meta.totalPages;

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

      <div className="overflow-hidden rounded-md border border-brand-line bg-card shadow-card">
        <ul className="divide-y divide-border">
          {data.data.map((group) => (
            <li key={group.key}>
              <NotificationGroup group={group} role={user.role} />
            </li>
          ))}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
