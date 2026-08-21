"use client";

import { NotificationList } from "@/features/notifications";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/**
 * Shared across roles like /dashboard: the API scopes notifications to the
 * caller, so companies see candidate submissions and recruiters see status
 * changes from the same page.
 */
export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="w-full">
        <NotificationList />
      </div>
    </DashboardLayout>
  );
}
