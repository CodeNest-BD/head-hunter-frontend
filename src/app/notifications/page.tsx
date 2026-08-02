"use client";

import Link from "next/link";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { RequireRole } from "@/shared/components/RequireRole";

export default function NotificationsPage() {
  return (
    <RequireRole role="recruiter">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <NotificationList />
      </main>
    </RequireRole>
  );
}
