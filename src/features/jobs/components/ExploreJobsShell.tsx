"use client";

import { useAuth } from "@/features/auth";
import { PublicShell } from "@/components/landing/PublicShell";

import { ExploreJobsView } from "./ExploreJobsView";

/**
 * Explore is a public route, so it always uses the marketing chrome — no
 * dashboard sidebar — even for signed-in users (the marketing nav shows their
 * account menu). We still hold render until the session settles so the nav
 * doesn't flash the guest CTAs before swapping to the account menu.
 */
export function ExploreJobsShell() {
  const { status } = useAuth();

  if (status === "booting") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
        Loading…
      </div>
    );
  }

  return (
    <PublicShell fluid>
      <ExploreJobsView />
    </PublicShell>
  );
}
