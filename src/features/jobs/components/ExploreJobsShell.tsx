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
 * While the session is still booting we render the public shell rather than
 * guessing — the alternative is a dashboard frame that flips to marketing (or
 * back) a moment later.
 */
export function ExploreJobsShell() {
  const { status, user } = useAuth();
  const signedIn = status === "authenticated" && user !== null;

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
