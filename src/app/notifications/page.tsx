"use client";

import { RequireRole } from "@/features/auth";
import { NotificationList } from "@/features/notifications";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

export default function NotificationsPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout>
        <div className="flex max-w-2xl flex-col gap-8">
          <PageHeader
            eyebrow="Activity"
            title="Notifications"
            subtitle="New jobs from the companies you follow."
          />
          <NotificationList />
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}
