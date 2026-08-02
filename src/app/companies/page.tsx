"use client";

import { RequireRole } from "@/features/auth";
import Link from "next/link";
import { CompanyList } from "@/features/companies";

export default function CompaniesPage() {
  return (
    <RequireRole role="recruiter">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Follow a company to be notified when it posts a job.
          </p>
        </div>
        <CompanyList />
      </main>
    </RequireRole>
  );
}
