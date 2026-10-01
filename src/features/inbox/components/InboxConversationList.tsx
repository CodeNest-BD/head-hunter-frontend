"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  CheckCheck,
  Inbox,
  Search,
} from "lucide-react";

import { useMarkAllThreadsRead } from "@/features/conversations/hooks/useConversation";
import { CANDIDATE_STATUS_TONES } from "@/features/candidates/components/statusStyles";
import {
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "@/features/candidates/schemas";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  companyJobPath,
  inboxThreadPath,
  jobPath,
  type EntityRef,
} from "@/shared/utils/entityPaths";
import { formatDate } from "@/shared/utils/formatDate";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { RefChip } from "@/shared/ui-components/badges/RefChip";
import { PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardHeader } from "@/shared/ui-components/controls/card";
import { Input } from "@/shared/ui-components/controls/input";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ListRow } from "@/shared/ui-components/list/ListRow";

import type { InboxSide } from "../api/inbox";
import {
  useInboxAttentionCount,
  useInboxConversations,
} from "../hooks/useInbox";
import type { InboxConversationRow } from "../schemas";

const COPY: Record<
  InboxSide,
  {
    subtitle: string;
    jobHref: (job: EntityRef) => string;
    emptyHint: { href: string; label: string; before: string; after: string };
  }
> = {
  company: {
    subtitle:
      "Conversations with recruiters about the candidates they submitted.",
    jobHref: companyJobPath,
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
    jobHref: jobPath,
    emptyHint: {
      before: "Submit a candidate from the ",
      href: "/explore-jobs",
      label: "live job map",
      after: " to start a conversation.",
    },
  },
};

type Filter = "all" | "unread";

/** The two positions of the reference's `.seg` control above the list. */
const FILTERS: readonly Filter[] = ["all", "unread"];

/** Server page size — shared by the query and the pager's range readout so the
 * "N–M of total" it prints matches what the server actually returned. */
const PAGE_SIZE = 20;

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

  const attentionCount = useInboxAttentionCount(side).data ?? 0;
  const markAllRead = useMarkAllThreadsRead();

  const rows = data?.data ?? [];
  const meta = data?.meta;
  // Counts what the page highlights, so the readout matches the tinted rows —
  // a thread waiting on an answer is one of them.
  const unreadOnPage = rows.filter(
    (r) => r.unreadMessages > 0 || r.needsReview,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Inbox"
        subtitle={copy.subtitle}
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={markAllRead.isPending || attentionCount === 0}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck />
            Mark all as read
          </Button>
        }
      />

      {/* `.toolbar` — the 36px search box and the All/Unread segmented control
       * sit directly on the canvas, left-aligned as one group. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] max-w-[360px] flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-[11px] top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, candidate or job"
            className="pl-8 text-sub"
          />
        </div>
        <div className="inline-flex shrink-0 rounded-sm border border-line bg-surface-sunken p-0.5">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-xs px-3 text-[12.5px] font-semibold capitalize transition-colors",
                filter === key
                  ? "bg-surface text-ink shadow-e1"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {key}
            </button>
          ))}
        </div>
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
        <div className="overflow-hidden rounded-md border border-line bg-surface shadow-e1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[84px] w-full animate-pulse border-b border-line bg-surface-sub last:border-b-0"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={Inbox}
            title={
              q || filter === "unread"
                ? "No conversations match"
                : "No conversations yet"
            }
            description={
              !q && filter !== "unread" ? (
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
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card
          className={cn(
            "overflow-hidden transition-opacity",
            isPlaceholderData && "opacity-60",
          )}
        >
          <CardHeader className="py-2.5">
            <span className="text-label font-[650] uppercase text-ink-muted">
              Conversations
            </span>
            {unreadOnPage > 0 ? (
              <span className="ml-auto text-meta tabular-nums text-ink-muted">
                {unreadOnPage} unread
              </span>
            ) : null}
          </CardHeader>
          <ul>
            {rows.map((row) => (
              <ConversationRow
                key={row.candidateId}
                row={row}
                side={side}
                onOpen={() =>
                  router.push(
                    inboxThreadPath(side, {
                      id: row.candidateId,
                      serialNumber: row.candidateSerialNumber,
                    }),
                  )
                }
                jobHref={copy.jobHref({
                  id: row.jobId,
                  serialNumber: row.jobSerialNumber,
                })}
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
        </Card>
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
    // The separator lives on the list item so the row's own `last:` rule stays
    // true — `ListRow` then owns only the padding, tint and cobalt rail.
    <li className="border-b border-line last:border-b-0">
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
        className="cursor-pointer"
      >
        <ListRow unread={needsYou} interactive className="border-b-0">
          {/* Unread dot — kept in the flow when read so the columns stay aligned. */}
          <span className="flex w-[7px] shrink-0 justify-center pt-[7px]">
            {needsYou ? (
              <span
                className="block size-[7px] shrink-0 rounded-full bg-blue"
                aria-label="Unread"
              />
            ) : null}
          </span>

          <Avatar name={row.counterpartyName} size="md" />

          {/* Subject + preview */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sub text-ink",
                  needsYou ? "font-[650]" : "font-semibold",
                )}
              >
                {row.counterpartyName}
              </span>
              <span className="shrink-0 whitespace-nowrap text-meta tabular-nums text-ink-faint">
                {formatDate(row.lastActivityAt)}
              </span>
            </div>

            <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sub text-ink-muted">
                {row.candidateName}
              </span>
              <span aria-hidden="true" className="text-ink-faint">
                ·
              </span>
              <Link
                href={jobHref}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex min-w-0 max-w-full"
              >
                <RefChip className="transition-colors hover:bg-info-line">
                  <Briefcase aria-hidden="true" />
                  <span className="truncate">{row.jobTitle}</span>
                </RefChip>
              </Link>
              <span className="ml-auto shrink-0">
                <StatusPill status={row.status} needsReview={row.needsReview} />
              </span>
            </div>

            <p
              className={cn(
                "mt-[3px] truncate text-sub",
                hasMessage && unread
                  ? "font-[550] text-ink-body"
                  : "text-ink-muted",
              )}
            >
              {preview}
            </p>
          </div>
        </ListRow>
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
  return needsReview ? (
    <StatusBadge label="Review" tone="warn" />
  ) : (
    <StatusBadge
      label={CANDIDATE_STATUS_LABELS[status]}
      tone={CANDIDATE_STATUS_TONES[status]}
    />
  );
}
