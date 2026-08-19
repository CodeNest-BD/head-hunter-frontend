"use client";

import { NotificationList } from "@/features/notifications";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * Shared across roles like /dashboard: the API scopes notifications to the
 * caller, so companies see candidate submissions and recruiters see status
 * changes from the same page.
 */
export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader
          title="Notifications"
          subtitle="Updates on your jobs, submissions and followed companies."
        />
        <NotificationList />
      </div>
    </DashboardLayout>
  );
}
