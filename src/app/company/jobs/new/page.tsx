"use client";

import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, Sparkles, Users } from "lucide-react";

import { RequireApprovedCompany, RequireRole } from "@/features/auth";
import { JobForm, useCreateAndPublishJob, useCreateJob } from "@/features/jobs";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

const TIPS = [
  {
    icon: BadgeDollarSign,
    title: "Set a competitive fee",
    body: "The fee is your headline on the job map — stronger fees attract more experienced recruiters, faster.",
  },
  {
    icon: Sparkles,
    title: "Write a real description",
    body: "Recruiters pitch your role to candidates. Team, stack, mission — give them something to sell.",
  },
  {
    icon: Users,
    title: "Publish when ready",
    body: "Drafts are private. Publishing reserves your fee and puts the role in front of every verified recruiter.",
  },
] as const;

export default function NewJobPage() {
  const create = useCreateJob();
  const createAndPublish = useCreateAndPublishJob();

  return (
    <RequireRole role="company">
      <DashboardLayout>
        <RequireApprovedCompany>
          <div className="flex w-full flex-col gap-6">
            <Link
              href="/company/jobs"
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </Link>
            <PageHeader
              title="Post a job"
              subtitle="Save it as a draft, or publish it live right away — publishing reserves the fee and notifies recruiters."
              className="mb-0"
            />
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
              <JobForm
                onSubmit={(input, intent) =>
                  intent === "publish"
                    ? createAndPublish.mutate(input)
                    : create.mutate(input)
                }
                isSubmitting={create.isPending || createAndPublish.isPending}
                submitLabel="Save draft"
              />
              <aside className="top-24 flex flex-col gap-4 lg:sticky">
                {TIPS.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div
                      key={tip.title}
                      className="rounded-md border border-border/70 bg-card p-5 shadow-sm"
                    >
                      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <h3 className="font-heading text-sm font-extrabold text-foreground">
                        {tip.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {tip.body}
                      </p>
                    </div>
                  );
                })}
              </aside>
            </div>
          </div>
        </RequireApprovedCompany>
      </DashboardLayout>
    </RequireRole>
  );
}
