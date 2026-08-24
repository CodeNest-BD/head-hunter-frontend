"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { PageBanner } from "@/shared/ui-components/brand";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import type { InboxSide } from "../api/inbox";
import { useInboxJobs } from "../hooks/useInbox";

type Filter = "needs-review" | "all" | "reviewed";

/** The two sides read the same drill-down; only the words and links differ. */
const COPY: Record<
  InboxSide,
  {
    subtitle: string;
    emptyHint: { href: string; label: string; before: string; after: string };
    cta: string;
    hrefFor: (jobId: string) => string;
    freshLabel: string;
  }
> = {
  company: {
    subtitle:
      "Every job with candidates submitted — open one to review them.",
    emptyHint: {
      before: "Recruiters can only submit candidates to your ",
      href: "/company/jobs",
      label: "published jobs",
      after: ".",
    },
    cta: "Review candidates",
    hrefFor: (jobId) => `/company/inbox/job/${jobId}`,
    freshLabel: "new",
  },
  recruiter: {
    subtitle:
      "Every job you have sent someone to — open one to see your candidates and their conversations.",
    emptyHint: {
      before: "Send a candidate from the ",
      href: "/explore-jobs",
      label: "live job map",
      after: " to start a conversation.",
    },
    cta: "View candidates",
    hrefFor: (jobId) => `/recruiter/inbox/job/${jobId}`,
    freshLabel: "awaiting review",
  },
};

/**
 * Level 1 of either inbox: one row per job with candidates on it. Opens on the
 * jobs that need attention; clicking a row drills into its candidates.
 */
export function InboxJobsTable({ side }: { side: InboxSide }) {
  const [filter, setFilter] = useState<Filter>("needs-review");
  const { data, isPending, isError, refetch } = useInboxJobs(side, {
    page: 1,
    limit: 100,
  });
  const copy = COPY[side];

  const rows = data?.data ?? [];
  const newTotal = rows.reduce((sum, r) => sum + r.newCandidateCount, 0);
  const candidatesTotal = rows.reduce((sum, r) => sum + r.candidateCount, 0);
  const needsReviewCount = rows.filter((r) => r.newCandidateCount > 0).length;

  const visible =
    filter === "needs-review"
      ? rows.filter((r) => r.newCandidateCount > 0)
      : filter === "reviewed"
        ? rows.filter((r) => r.newCandidateCount === 0)
        : rows;

  const chips: readonly { key: Filter; label: string }[] = [
    {
      key: "needs-review",
      label:
        needsReviewCount > 0
          ? `Needs review · ${needsReviewCount}`
          : "Needs review",
    },
    { key: "all", label: "All jobs" },
    { key: "reviewed", label: "Reviewed" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Inbox"
        subtitle={copy.subtitle}
        metrics={[
          { label: "New", value: newTotal },
          { label: "Total candidates", value: candidatesTotal },
        ]}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              active={filter === chip.key}
              onClick={() => setFilter(chip.key)}
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>

        {isError ? (
          <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-[18px] w-[18px]" />
              Could not load your inbox.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-md border border-border/70 bg-muted"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Inbox className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-semibold text-navy">
                {filter === "needs-review"
                  ? "Nothing needs review"
                  : "No candidates yet"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {copy.emptyHint.before}
                <Link
                  href={copy.emptyHint.href}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {copy.emptyHint.label}
                </Link>
                {copy.emptyHint.after}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
            <ul className="divide-y divide-border">
              {visible.map((row) => {
                const fresh = row.newCandidateCount > 0;
                return (
                  <li key={row.jobId} className="relative">
                    <Link
                      href={copy.hrefFor(row.jobId)}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-3.5 transition-colors sm:px-5",
                        fresh ? "bg-primary/[0.04]" : "hover:bg-secondary/50",
                      )}
                    >
                      {fresh && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-0 h-full w-[3px] bg-primary"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-navy">
                            {row.jobTitle}
                          </span>
                          <UnreadBadge count={row.unreadMessages} />
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {row.candidateCount} candidate
                          {row.candidateCount === 1 ? "" : "s"}
                          {fresh
                            ? ` · ${row.newCandidateCount} ${copy.freshLabel}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                          {formatDate(row.lastCandidateAt)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          {copy.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
