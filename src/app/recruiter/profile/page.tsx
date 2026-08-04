"use client";

import Link from "next/link";
import { RequireRole } from "@/features/auth";
import {
  RecruiterProfileForm,
  ReferencesSection,
  SubscriptionCard,
  useMyRecruiterProfile,
} from "@/features/recruiters";

function RecruiterProfileContent() {
  const { data, isPending, isError, refetch } = useMyRecruiterProfile();

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

  return (
    <div className="flex flex-col gap-8">
      <SubscriptionCard profile={data} />
      <RecruiterProfileForm profile={data} />
      <ReferencesSection references={data.references} />
    </div>
  );
}

export default function RecruiterProfilePage() {
  return (
    <RequireRole role="recruiter">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Recruiter profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Your details, specializations and references.
          </p>
        </div>
        <RecruiterProfileContent />
      </main>
    </RequireRole>
  );
}
