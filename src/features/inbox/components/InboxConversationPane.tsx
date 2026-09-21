"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { Input } from "@/shared/ui-components/controls/input";

import type { InboxSide } from "../api/inbox";
import { useInboxConversations } from "../hooks/useInbox";

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

type Filter = "all" | "unread";

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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="font-heading text-base font-bold text-navy">Inbox</h2>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 text-xs">
          {(["all", "unread"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-md px-2.5 py-1 font-semibold capitalize transition-colors",
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
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="h-9 rounded-lg pl-8 text-sm"
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto scrollbar-navy">
        {rows.map((row) => {
          const selected = row.candidateId === selectedId;
          const unread = row.unreadMessages > 0;
          return (
            <li key={row.candidateId} className="relative">
              {selected ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-[3px] bg-primary"
                />
              ) : null}
              <Link
                href={`/${side}/inbox/${row.candidateId}`}
                className={cn(
                  "flex items-start gap-2.5 px-4 py-3 transition-colors",
                  selected ? "bg-secondary/60" : "hover:bg-secondary/40",
                )}
              >
                <span className="flex w-1.5 shrink-0 justify-center pt-2">
                  {unread && !selected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                    avatarTint(row.counterpartyName),
                  )}
                >
                  {initials(row.counterpartyName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-[13px]",
                        unread
                          ? "font-bold text-navy"
                          : "font-semibold text-navy",
                      )}
                    >
                      {row.counterpartyName}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatDate(row.lastActivityAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                    <span className="shrink-0 truncate text-[11.5px] text-foreground/70">
                      {row.candidateName}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground/60"
                    >
                      ·
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-md border border-border bg-primary/5 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{row.jobTitle}</span>
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-[12px]",
                      unread ? "text-navy" : "text-muted-foreground",
                    )}
                  >
                    {row.lastMessagePreview ?? "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            No conversations
          </li>
        ) : null}
      </ul>
    </div>
  );
}
