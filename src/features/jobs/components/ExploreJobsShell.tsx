"use client";

import { useAuth } from "@/features/auth";
import { PublicShell } from "@/components/landing/PublicShell";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

import { ExploreJobsView } from "./ExploreJobsView";

/**
 * One page, two shells.
 *
 * Guests need the marketing chrome and the sign-up path. Signed-in users need
 * their sidebar: the job map is a sidebar destination for recruiters, and
 * rendering it inside the public shell dropped them onto a page with no
 * navigation out of it.
 *
 * While the session is still booting neither shell is rendered. This page is
 * public, so the auth provider lets it through immediately — which meant a
 * reload painted the full marketing hero and then swapped it for the dashboard
 * once the silent refresh landed. A neutral frame is briefer and does not lie
 * about who is looking.
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
