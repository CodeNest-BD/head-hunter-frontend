"use client";

import { RequireRole } from "@/features/auth";
import { NotificationList } from "@/features/notifications";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function NotificationsPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-2xl flex-col gap-8">
          <header className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              New jobs from the companies you follow.
            </p>
          </header>
          <NotificationList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
