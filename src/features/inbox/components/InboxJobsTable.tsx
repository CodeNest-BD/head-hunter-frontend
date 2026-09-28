"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { PageHeader } from "@/shared/ui-components/brand";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
import { Button } from "@/shared/ui-components/controls/button";
import { Card } from "@/shared/ui-components/controls/card";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ListRow } from "@/shared/ui-components/list/ListRow";
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
    subtitle: "Every job with candidates submitted — open one to review them.",
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
    <div className="flex flex-col gap-4">
      <PageHeader
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
          <Alert tone="bad" icon={AlertCircle}>
            <div className="flex flex-col items-start gap-2.5">
              <span className="font-[650]">Could not load your inbox.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </Alert>
        ) : isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-md border border-line bg-surface-sub"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon={Inbox}
              title={
                filter === "needs-review"
                  ? "Nothing needs review"
                  : "No candidates yet"
              }
              description={
                <>
                  {copy.emptyHint.before}
                  <Link
                    href={copy.emptyHint.href}
                    className="font-[550] text-blue-ink underline-offset-2 hover:underline"
                  >
                    {copy.emptyHint.label}
                  </Link>
                  {copy.emptyHint.after}
                </>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul>
              {visible.map((row) => {
                const fresh = row.newCandidateCount > 0;
                return (
                  // The separator lives on the list item so `ListRow`'s own
                  // `last:` rule keeps working inside the link wrapper.
                  <li
                    key={row.jobId}
                    className="border-b border-line last:border-b-0"
                  >
                    <Link href={copy.hrefFor(row.jobId)} className="block">
                      <ListRow
                        unread={fresh}
                        interactive
                        className="items-center gap-4 border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-block font-[650] text-ink">
                              {row.jobTitle}
                            </span>
                            <UnreadBadge count={row.unreadMessages} />
                          </div>
                          <p className="mt-[3px] text-sub text-ink-muted">
                            {row.candidateCount} candidate
                            {row.candidateCount === 1 ? "" : "s"}
                            {fresh
                              ? ` · ${row.newCandidateCount} ${copy.freshLabel}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="whitespace-nowrap text-meta tabular-nums text-ink-faint">
                            {formatDate(row.lastCandidateAt)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sub font-[650] text-blue-ink">
                            {copy.cta}
                            <ArrowRight
                              aria-hidden="true"
                              className="size-3.5"
                            />
                          </span>
                        </div>
                      </ListRow>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
