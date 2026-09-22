"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Briefcase, Inbox, Search } from "lucide-react";

import {
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "@/features/candidates/schemas";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
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
    subtitle:
      "Conversations with recruiters about the candidates they submitted.",
    jobHref: (jobId) => `/company/jobs/${jobId}`,
    emptyHint: {
      before: "Recruiters submit candidates to your ",
      href: "/company/jobs",
      label: "published jobs",
      after: " — each one starts a conversation here.",
    },
  },
  recruiter: {
    subtitle:
      "Conversations with companies about the candidates you submitted.",
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

/** Server page size — shared by the query and the pager's range readout so the
 * "N–M of total" it prints matches what the server actually returned. */
const PAGE_SIZE = 20;

/** The chip a thread wears while it carries news the reader has not seen — the
 * platform's needs-action amber, as on an open dispute. */
const REVIEW_STYLE = "bg-[#FBF3DF] text-[#7A5109]";

/** Soft two-tone chip per pipeline stage, matching the design's colours. */
const STATUS_STYLES: Record<CandidateStatus, string> = {
  submitted: "bg-[#EEF1F6] text-[#5B6B7C]",
  reviewing: "bg-[#FBF3DF] text-[#7A5109]",
  interviewing: "bg-[#E8EEFB] text-[#3B5BA9]",
  offered: "bg-[#EFE9FB] text-[#6B4FA8]",
  hired: "bg-[#E7F4EC] text-[#17734E]",
  passed: "bg-[#F1EFEF] text-[#8A7F7F]",
};

/** A stable per-counterparty tint for the initials tile. */
const AVATAR_PALETTE = [
  "bg-[#E8EDFB] text-[#3F5BA9]",
  "bg-[#FBF1DC] text-[#8A6D3B]",
  "bg-[#E7F0E9] text-[#3F7A5A]",
  "bg-[#F2E9F3] text-[#7A4F86]",
  "bg-[#FBE9E6] text-[#9B4A3F]",
];
function avatarTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The inbox: a flat list of message threads, most-recent first — a row is the
 * whole card, and clicking it opens the conversation. The job the thread is
 * about is a nested link that routes to the job instead.
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
      limit: PAGE_SIZE,
      q: q || undefined,
      unreadOnly: filter === "unread",
    });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  // Counts what the page highlights, so the readout matches the tinted rows —
  // a thread waiting on an answer is one of them.
  const unreadOnPage = rows.filter(
    (r) => r.unreadMessages > 0 || r.needsReview,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-navy">
          Inbox
        </h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      {/* Search + All/Unread segmented control — a left-aligned group, so the
       * control sits beside the search rather than stranded at the far edge. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] max-w-[480px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, candidate or job"
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "unread"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
                filter === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {key}
            </button>
          ))}
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
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[84px] w-full animate-pulse border-b border-border/60 bg-muted/40 last:border-0"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-input bg-card px-6 py-16 text-center">
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
              "overflow-hidden rounded-xl border border-border bg-card shadow-card transition-opacity",
              isPlaceholderData && "opacity-60",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Conversations
              </span>
              {unreadOnPage > 0 ? (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {unreadOnPage} unread
                </span>
              ) : null}
            </div>
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
            <TablePager
              page={meta?.page ?? 1}
              totalPages={meta?.totalPages ?? 1}
              total={meta?.total ?? rows.length}
              pageSize={PAGE_SIZE}
              onPage={setPage}
            />
          </div>
        </>
      )}
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
  // Anything unseen on the thread — a status change, an offer, a proposed
  // interview — stands out exactly like an unread message does. It is the same
  // rule the sidebar badge counts.
  const needsYou = unread || row.needsReview;
  const youSentLast = row.lastMessageSender === side;
  const hasMessage = row.lastMessagePreview !== null;
  const preview = hasMessage
    ? `${youSentLast ? "You: " : ""}${row.lastMessagePreview}`
    : noMessageLine(row);

  return (
    <li>
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
          "flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors",
          needsYou
            ? "bg-primary/[0.05] hover:bg-primary/[0.09]"
            : "hover:bg-secondary/40",
        )}
      >
        {/* Unread dot */}
        <span className="flex w-2 shrink-0 justify-center pt-2">
          {needsYou ? (
            <span
              className="h-2 w-2 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : null}
        </span>

        {/* Avatar */}
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
            avatarTint(row.counterpartyName),
          )}
        >
          {initials(row.counterpartyName)}
        </span>

        {/* Subject + preview */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[15px]",
                needsYou ? "font-bold text-navy" : "font-semibold text-navy",
              )}
            >
              {row.counterpartyName}
            </span>
            <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {formatDate(row.lastActivityAt)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] text-navy/80">
              {row.candidateName}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <Link
              href={jobHref}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex max-w-full items-center gap-1 rounded-[5px] border border-[#D7E0EF] bg-[#F1F5FC] px-1.5 py-0.5 text-[12px] font-medium text-[#24457A] transition-colors hover:bg-[#E7EEFA]"
            >
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="truncate">{row.jobTitle}</span>
            </Link>
            <span className="ml-auto shrink-0">
              <StatusPill status={row.status} needsReview={row.needsReview} />
            </span>
          </div>

          <p
            className={cn(
              "mt-1.5 truncate text-[13px]",
              hasMessage && unread
                ? "font-medium text-navy"
                : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
        </div>
      </div>
    </li>
  );
}

/**
 * The stage chip, except while the thread carries unseen news: then it says
 * what to do rather than where the candidate stands, because the stage is in
 * the thing waiting to be read.
 */
function StatusPill({
  status,
  needsReview,
}: {
  status: CandidateStatus;
  needsReview: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
        needsReview ? REVIEW_STYLE : STATUS_STYLES[status],
      )}
    >
      {needsReview ? "Review" : CANDIDATE_STATUS_LABELS[status]}
    </span>
  );
}
