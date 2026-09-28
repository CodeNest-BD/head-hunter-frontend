"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { RefChip } from "@/shared/ui-components/badges/RefChip";
import { Input } from "@/shared/ui-components/controls/input";
import { ListRow } from "@/shared/ui-components/list/ListRow";

import type { InboxSide } from "../api/inbox";
import { useInboxConversations } from "../hooks/useInbox";

type Filter = "all" | "unread";

/** The two positions of the reference's `.seg` control in the pane's head. */
const FILTERS: readonly Filter[] = ["all", "unread"];

/**
 * The compact conversation list that sits to the left of an open thread — the
 * design's two-pane inbox. It mirrors the full list's data and row, minus the
 * page header, status pill and pager, and highlights the open thread.
 */
export function InboxConversationPane({
  side,
  selectedId,
}: {
  side: InboxSide;
  selectedId: string;
}) {
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 300);
  const [filter, setFilter] = useState<Filter>("all");

  const { data } = useInboxConversations(side, {
    page: 1,
    limit: 50,
    q: q || undefined,
    unreadOnly: filter === "unread",
  });
  const rows = data?.data ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface shadow-e1">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h2 className="text-block font-[650] text-ink">Inbox</h2>
        {/* `.seg` — the compact All/Unread switch. */}
        <div className="inline-flex rounded-sm border border-line bg-surface-sunken p-0.5">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex h-6 items-center rounded-xs px-2.5 text-[11.5px] font-semibold capitalize transition-colors",
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
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-[11px] top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="pl-8 text-sub"
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-navy">
        {rows.map((row) => {
          const selected = row.candidateId === selectedId;
          const unread = row.unreadMessages > 0;
          // Same rule as `InboxConversationList` and the sidebar badge: an
          // unseen offer, interview or status change marks the row too.
          const needsYou = unread || row.needsReview;
          return (
            // The separator lives on the list item so `ListRow`'s own `last:`
            // rule keeps working inside the link wrapper.
            <li
              key={row.candidateId}
              className="border-b border-line last:border-b-0"
            >
              <Link
                href={`/${side}/inbox/${row.candidateId}`}
                className="block"
              >
                <ListRow
                  unread={needsYou}
                  selected={selected}
                  interactive
                  className="gap-2.5 border-b-0 px-3 py-2.5"
                >
                  <span className="flex w-[7px] shrink-0 justify-center pt-[7px]">
                    {needsYou && !selected ? (
                      <span className="block size-[7px] shrink-0 rounded-full bg-blue" />
                    ) : null}
                  </span>
                  <Avatar name={row.counterpartyName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[12.5px] text-ink",
                          needsYou ? "font-[650]" : "font-semibold",
                        )}
                      >
                        {row.counterpartyName}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
                        {formatDate(row.lastActivityAt)}
                      </span>
                    </div>
                    <div className="mt-[2px] flex min-w-0 items-center gap-1.5">
                      <span className="shrink-0 truncate text-[11.5px] text-ink-muted">
                        {row.candidateName}
                      </span>
                      <span aria-hidden="true" className="text-ink-faint">
                        ·
                      </span>
                      <RefChip className="min-w-0">
                        <Briefcase aria-hidden="true" />
                        <span className="truncate">{row.jobTitle}</span>
                      </RefChip>
                    </div>
                    <p
                      className={cn(
                        "mt-[2px] truncate text-meta",
                        unread ? "font-[550] text-ink-body" : "text-ink-faint",
                      )}
                    >
                      {row.lastMessagePreview ?? "No messages yet"}
                    </p>
                  </div>
                </ListRow>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-center text-sub text-ink-muted">
            No conversations
          </li>
        ) : null}
      </ul>
    </div>
  );
}
