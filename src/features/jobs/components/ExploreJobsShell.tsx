"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth";
import { PublicShell } from "@/components/landing/PublicShell";
import { Button } from "@/shared/ui-components/controls/button";

import { ExploreJobsView } from "./ExploreJobsView";

/**
 * The live map is a recruiter surface. A signed-in company gets a short
 * explainer instead of the map — the same block whether they arrived from a
 * (now hidden) link or by typing the URL directly. Guests, recruiters and
 * admins see the map.
 */
function CompanyNotAvailable() {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-5">
        <h1 className="font-heading text-2xl font-extrabold text-navy">
          The live map is for recruiters
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Exploring open roles on the live map is a recruiter feature. As a
          company you post jobs and review the candidates recruiters submit.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/company/jobs/new">Post a job</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}

/**
 * Explore is a public route, so it always uses the marketing chrome — no
 * dashboard sidebar — even for signed-in users (the marketing nav shows their
 * account menu). We still hold render until the session settles so the nav
 * doesn't flash the guest CTAs before swapping to the account menu.
 */
export function ExploreJobsShell() {
  const { status, user } = useAuth();

  if (status === "booting") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
        Loading…
      </div>
    );
  }

  // The live map is recruiter-only; a company never sees it, by link or by URL.
  if (status === "authenticated" && user?.role === "company") {
    return <CompanyNotAvailable />;
  }

  return (
    <PublicShell>
      <ExploreJobsView />
    </PublicShell>
  );
}
