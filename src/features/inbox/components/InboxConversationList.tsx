"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Briefcase, Inbox, Search } from "lucide-react";

import { UnreadBadge } from "@/features/conversations/components/UnreadBadge";
import { CANDIDATE_STATUS_LABELS } from "@/features/candidates/schemas";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { PageBanner } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
import { Input } from "@/shared/ui-components/controls/input";
import { TablePager } from "@/shared/ui-components/data/TablePager";

import type { InboxSide } from "../api/inbox";
import { useInboxConversations } from "../hooks/useInbox";
import type { InboxConversationRow } from "../schemas";

const COPY: Record<
  InboxSide,
  {
    subtitle: string;
    jobHref: (jobId: string) => string;
    emptyHint: { href: string; label: string; before: string; after: string };
  }
> = {
  company: {
    subtitle: "Your conversations with recruiters — open one to reply.",
    jobHref: (jobId) => `/company/jobs/${jobId}`,
    emptyHint: {
      before: "Recruiters submit candidates to your ",
      href: "/company/jobs",
      label: "published jobs",
      after: " — each one starts a conversation here.",
    },
  },
  recruiter: {
    subtitle: "Your conversations with companies — open one to reply.",
    jobHref: (jobId) => `/jobs/${jobId}`,
    emptyHint: {
      before: "Submit a candidate from the ",
      href: "/explore-jobs",
      label: "live job map",
      after: " to start a conversation.",
    },
  },
};

type Filter = "all" | "unread";

/** Two-letter initials for the counterparty avatar. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The inbox: a flat list of message threads, most-recent first. A row is the
 * whole card — clicking it opens the conversation. The job it's about is a
 * nested link that routes to the job instead, so context is one click away
 * without leaving the row ambiguous.
 */
export function InboxConversationList({ side }: { side: InboxSide }) {
  const router = useRouter();
  const copy = COPY[side];

  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 300);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  // A new search or filter always starts back on page 1.
  useEffect(() => {
    setPage(1);
  }, [q, filter]);

  const { data, isPending, isError, refetch, isPlaceholderData } =
    useInboxConversations(side, {
      page,
      limit: 20,
      q: q || undefined,
      unreadOnly: filter === "unread",
    });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <PageBanner title="Inbox" subtitle={copy.subtitle} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, job or candidate…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </FilterChip>
            <FilterChip
              active={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Unread
            </FilterChip>
          </div>
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
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[68px] w-full animate-pulse rounded-md border border-border/70 bg-muted"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Inbox className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-semibold text-navy">
                {q || filter === "unread"
                  ? "No conversations match"
                  : "No conversations yet"}
              </p>
              {!q && filter !== "unread" ? (
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
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "overflow-hidden rounded-md border border-border bg-card shadow-card transition-opacity",
                isPlaceholderData && "opacity-60",
              )}
            >
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <ConversationRow
                    key={row.candidateId}
                    row={row}
                    side={side}
                    onOpen={() =>
                      router.push(`/${side}/inbox/${row.candidateId}`)
                    }
                    jobHref={copy.jobHref(row.jobId)}
                  />
                ))}
              </ul>
            </div>

            {meta && meta.totalPages > 1 ? (
              <TablePager
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                pageSize={rows.length}
                onPage={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/** The preview line when a thread has no messages yet — factual, not "empty". */
function noMessageLine(row: InboxConversationRow): string {
  if (row.status === "passed") return "Conversation closed";
  if (row.status === "hired") return "Candidate hired";
  return "No messages yet — start the conversation";
}

function ConversationRow({
  row,
  side,
  onOpen,
  jobHref,
}: {
  row: InboxConversationRow;
  side: InboxSide;
  onOpen: () => void;
  jobHref: string;
}) {
  const unread = row.unreadMessages > 0;
  const youSentLast = row.lastMessageSender === side;
  const hasMessage = row.lastMessagePreview !== null;
  const preview = hasMessage
    ? `${youSentLast ? "You: " : ""}${row.lastMessagePreview}`
    : noMessageLine(row);

  return (
    <li className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors sm:px-5",
          unread ? "bg-primary/[0.04]" : "hover:bg-secondary/50",
        )}
      >
        {unread && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-[3px] bg-primary"
          />
        )}
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            unread
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {initials(row.counterpartyName)}
        </span>

        <div className="min-w-0 flex-1">
          {/* Line 1: who the conversation is with, its stage, and when it last moved. */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate",
                unread ? "font-bold text-navy" : "font-semibold text-navy",
              )}
            >
              {row.counterpartyName}
            </span>
            <span className="shrink-0 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              {CANDIDATE_STATUS_LABELS[row.status]}
            </span>
            <span className="ml-auto shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {formatDate(row.lastActivityAt)}
            </span>
          </div>

          {/* Line 2: the subject — which candidate, for which role (role links out). */}
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="truncate">
              Candidate:{" "}
              <span className="font-medium text-navy">
                {row.candidateName}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <Link
              href={jobHref}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex min-w-0 items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
            >
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="truncate">{row.jobTitle}</span>
            </Link>
          </div>

          {/* Line 3: the last message, or a factual state when there is none. */}
          <div className="mt-1 flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm",
                !hasMessage
                  ? "italic text-muted-foreground"
                  : unread
                    ? "font-medium text-navy"
                    : "text-muted-foreground",
              )}
            >
              {preview}
            </p>
            <UnreadBadge count={row.unreadMessages} />
          </div>
        </div>
      </div>
    </li>
  );
}
