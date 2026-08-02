"use client";

import { RequireRole } from "@/features/auth";
import Link from "next/link";
import { CompanyProfileForm, useMyCompanyProfile } from "@/features/companies";

function CompanyProfileContent() {
  const { data, isPending, isError, refetch } = useMyCompanyProfile();

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load your profile.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </p>
    );
  }
  return <CompanyProfileForm profile={data} />;
}

export default function CompanyProfilePage() {
  return (
    <RequireRole role="company">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Company profile</h1>
          <p className="text-sm text-muted-foreground">
            This is what recruiters see when they browse companies.
          </p>
        </div>
        <CompanyProfileContent />
      </main>
    </RequireRole>
  );
}
