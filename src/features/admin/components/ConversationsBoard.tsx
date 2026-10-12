"use client";

import { useState } from "react";
import { AlertCircle, MessagesSquare } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui-components/controls/button";
import { TONE_DOT } from "@/shared/ui-components/badges/Pill";
import {
  ToolbarSearch,
  ToolbarSelect,
} from "@/shared/ui-components/data/ListToolbar";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import { ScopeChip } from "@/shared/ui-components/data/ScopeChip";
import { TABLE_CARD } from "@/shared/ui-components/data/tableStyles";
import { DEFAULT_PAGE_SIZE } from "../api/admin";
import { useAdminConversations } from "../hooks/useAdmin";
import { ListPager } from "./ListPager";
import { ConversationThread, type ThreadFilter } from "./ConversationThread";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";
import type { ConversationListItem } from "../schemas";

/** The design's wording for where a submission has got to. */
const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  interviewing: "Interviewing",
  offered: "Offer",
  hired: "Hired",
  passed: "Rejected",
};

const STATUS_FILTER_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewing", label: "Reviewing" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "passed", label: "Rejected" },
] as const;

const WINDOW_FILTER_OPTIONS = [
  { value: "7", label: "Active in 7 days" },
  { value: "30", label: "Active in 30 days" },
  { value: "90", label: "Active in 90 days" },
] as const;

const THREAD_TABS: { value: ThreadFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "messages", label: "Messages" },
  { value: "events", label: "Events" },
];

/** Today keeps a clock; anything older names the day. */
function activityTime(iso: string): string {
  const at = new Date(iso);
  return at.toDateString() === new Date().toDateString()
    ? at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ThreadRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ConversationListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col gap-1 px-5 py-3.5 text-left transition-colors",
          selected ? "bg-tint shadow-rail" : "hover:bg-surface-sub",
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate font-medium text-ink">
            {conversation.companyName} · {conversation.recruiterName}
          </span>
          <span className="shrink-0 text-meta tabular-nums text-ink-muted">
            {activityTime(conversation.lastActivityAt)}
          </span>
        </span>
        <span className="block truncate text-sub text-ink-body">
          {conversation.jobTitle}
        </span>
        <span className="flex items-center gap-2 text-meta text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                TONE_DOT[
                  CANDIDATE_STATUS_TONES[conversation.status] ?? "neutral"
                ],
              )}
            />
            {STATUS_LABELS[conversation.status] ?? conversation.status}
          </span>
          <span className="tabular-nums">
            {conversation.messageCount} message
            {conversation.messageCount === 1 ? "" : "s"}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * Every company↔recruiter thread, read side by side: the list narrows, the
 * pane beside it holds the conversation. Admin is a reader here — there is no
 * composer, because an admin has no standing in the parties' own thread.
 */
export function ConversationsBoard({
  companyProfileId,
  companyName,
  initialCandidateId,
}: {
  /** When set, the list is restricted to one company (a deep-link). */
  companyProfileId?: string;
  companyName?: string;
  /** Opens straight onto one thread, e.g. from a notification. */
  initialCandidateId?: string;
} = {}) {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [status, setStatus] = useState("");
  const [withinDays, setWithinDays] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCandidateId ?? null,
  );
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>("all");
  const q = useDebouncedValue(qInput, 300);

  const hasFilters = qInput !== "" || status !== "" || withinDays !== "";
  const resetFilters = () => {
    setQInput("");
    setStatus("");
    setWithinDays("");
    setPage(1);
  };
  const applyFilter = (set: (next: string) => void) => (next: string) => {
    set(next);
    setPage(1);
  };

  const { data, isPending, isError, refetch } = useAdminConversations({
    page,
    limit: DEFAULT_PAGE_SIZE,
    q: q || undefined,
    status: status || undefined,
    withinDays: withinDays ? Number(withinDays) : undefined,
    companyProfileId,
  });

  const rows = data?.data ?? [];
  // Falls back to the first row, so the pane is never blank beside a list that
  // has something in it.
  const selected =
    rows.find((row) => row.candidateId === selectedId) ?? rows[0];

  return (
    <div className="flex flex-col gap-4">
      {companyProfileId && (
        <ScopeChip
          label={`Company: ${companyName || "Selected company"}`}
          clearHref="/admin/conversations"
          clearLabel="Clear company filter"
        />
      )}

      {/* Side by side the two panes fill what is left of the viewport and each
          scrolls its own contents, so the page itself never scrolls. The
          subtraction is the chrome above them: the topbar, `main`'s padding,
          and the page header with its gap.

          `lg:flex-nowrap` is load-bearing: a WRAPPED flex line sizes to its
          own content and overflows a container with a definite height, so the
          panes would ignore the height entirely and the page would scroll
          instead of them. Only an unwrapped line stretches its items to the
          container.

          No minimum height either — a floor taller than the space available
          puts the scrollbar back on the page.

          Stacked on a narrow screen they go back to growing with what is in
          them, where a fixed height would trap the list in a letterbox. */}
      <div className="flex flex-wrap items-stretch gap-4 lg:h-[calc(100vh-var(--topbar-h)-9.5rem)] lg:flex-nowrap">
        <div
          className={cn(TABLE_CARD, "flex min-w-0 flex-[1_1_340px] flex-col")}
        >
          <div className="flex shrink-0 flex-col gap-2 px-5 py-3.5">
            <ToolbarSearch
              value={qInput}
              onChange={setQInput}
              placeholder="Company, recruiter, job or candidate"
            />
            <div className="flex flex-wrap gap-2">
              <ToolbarSelect
                label="Workflow status"
                value={status}
                onChange={applyFilter(setStatus)}
                allLabel="Any workflow status"
                options={STATUS_FILTER_OPTIONS}
                className="flex-1"
              />
              <ToolbarSelect
                label="Recent activity"
                value={withinDays}
                onChange={applyFilter(setWithinDays)}
                allLabel="Any time"
                options={WINDOW_FILTER_OPTIONS}
                className="flex-1"
              />
            </div>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={resetFilters}
              >
                Clear filters
              </Button>
            )}
          </div>

          {isPending ? (
            <div className="flex flex-col">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex h-[76px] flex-col justify-center gap-2 border-t border-line px-5"
                >
                  <div className="h-3.5 w-2/3 animate-pulse rounded-xs bg-surface-sunken" />
                  <div className="h-3 w-1/3 animate-pulse rounded-xs bg-surface-sunken" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="m-5 flex flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
              <div className="flex items-center gap-2.5 font-[550]">
                <AlertCircle className="size-[15px] shrink-0" />
                Could not load conversations.
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No conversations found"
              description="Try a different search or filter."
              action={
                hasFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="m-0 min-h-0 flex-1 list-none divide-y divide-line overflow-y-auto border-t border-line p-0">
                {rows.map((conversation) => (
                  <ThreadRow
                    key={conversation.candidateId}
                    conversation={conversation}
                    selected={
                      selected?.candidateId === conversation.candidateId
                    }
                    onSelect={() => {
                      setSelectedId(conversation.candidateId);
                      setThreadFilter("all");
                    }}
                  />
                ))}
              </ul>
              {data && (
                <ListPager
                  page={page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </div>

        <div
          className={cn(TABLE_CARD, "flex min-w-0 flex-[2_1_560px] flex-col")}
        >
          {selected ? (
            <>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <h2 className="m-0 text-card font-[650] text-ink">
                    {selected.companyName} ↔ {selected.recruiterName}
                  </h2>
                  <p className="m-0 mt-0.5 text-sub text-ink-muted">
                    {selected.jobTitle} · {selected.candidateName} ·{" "}
                    {selected.messageCount} message
                    {selected.messageCount === 1 ? "" : "s"}
                  </p>
                </div>
                {/* A segmented control, not a filter: all three hold the same
                    thread and only the half on show changes. */}
                <div
                  role="group"
                  aria-label="Thread contents"
                  className="inline-flex shrink-0 rounded-sm bg-surface-sunken p-0.5"
                >
                  {THREAD_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      aria-pressed={threadFilter === tab.value}
                      onClick={() => setThreadFilter(tab.value)}
                      className={cn(
                        "h-7.5 rounded-xs px-3 text-sub font-medium transition-colors",
                        threadFilter === tab.value
                          ? "bg-surface text-ink shadow-chip"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto border-t border-line p-6">
                <ConversationThread
                  embedded
                  key={selected.candidateId}
                  candidateRef={selected.candidateId}
                  filter={threadFilter}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="No thread selected"
              description="Pick a conversation on the left to read it."
            />
          )}
        </div>
      </div>
    </div>
  );
}
