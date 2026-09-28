"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth";
import { BrandLoader } from "@/shared/ui-components/feedback/BrandLoader";
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
        <h1 className="text-display font-bold text-navy">
          The live map is for recruiters
        </h1>
        <p className="max-w-md text-body text-ink-body">
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
      /* Guest chrome or account chrome is not known until the session
         settles, so there is no shape to trace — the brand lockup, not a
         skeleton. Same wait as the app boot, so the same loader. */
      <BrandLoader className="min-h-screen" />
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
