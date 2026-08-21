"use client";

import { useAuth } from "@/features/auth";
import { PublicShell } from "@/components/landing/PublicShell";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

import { ExploreJobsView } from "./ExploreJobsView";

/**
 * One page, two shells: guests get the marketing chrome and sign-up path,
 * signed-in users get their sidebar.
 *
 * Neither renders while the session boots. This route is public, so the auth
 * provider lets it through immediately — without the hold, a reload painted the
 * marketing hero and then swapped it for the dashboard.
 */
export function ExploreJobsShell() {
  const { status, user } = useAuth();
  const signedIn = status === "authenticated" && user !== null;

  if (status === "booting") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
        Loading…
      </div>
    );
  }

  if (signedIn) {
    return (
      <DashboardLayout wide>
        <ExploreJobsView />
      </DashboardLayout>
    );
  }

  return (
    <PublicShell fluid>
      <ExploreJobsView />
    </PublicShell>
  );
}
