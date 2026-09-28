"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The height DashboardLayout's chrome always takes: the 4rem navbar plus
 * main's pt-6 (1.5rem) and pb-16 (4rem) — 9.5rem. The workspace fills exactly
 * what's left so the page never scrolls; each panel scrolls on its own.
 * `dvh` below `lg` so a mobile URL bar can't push the composer off-screen.
 */
const WORKSPACE_HEIGHT = "h-[calc(100dvh-9.5rem)] lg:h-[calc(100vh-9.5rem)]";

/**
 * The message-view workspace: the conversation list, the open conversation and
 * the candidate context as three equal-height panels of one surface — not
 * floating cards. `list` shows only at `xl` (there's a full inbox a click
 * away); `candidate` is a right rail from `lg`. Below `lg` the conversation and
 * candidate become tabs so a phone shows one at a time without burying either.
 */
export function InboxMessageWorkspace({
  list,
  conversation,
  candidate,
  candidateUnread = false,
  backHref,
}: {
  list: ReactNode;
  conversation: ReactNode;
  candidate: ReactNode;
  candidateUnread?: boolean;
  backHref: string;
}) {
  const [tab, setTab] = useState<"conversation" | "candidate">("conversation");

  return (
    <div className={cn("flex w-full flex-col gap-3", WORKSPACE_HEIGHT)}>
      {/* Below lg: a back link to the inbox plus the two-panel tabs. */}
      <div className="flex shrink-0 items-center gap-3 lg:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-[550] text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Inbox
        </Link>
        <div
          role="tablist"
          className="ml-auto inline-flex rounded-sm border border-line bg-surface-sunken p-0.5"
        >
          <WorkspaceTab
            active={tab === "conversation"}
            label="Conversation"
            onSelect={() => setTab("conversation")}
          />
          <WorkspaceTab
            active={tab === "candidate"}
            label="Candidate"
            unread={candidateUnread}
            onSelect={() => setTab("candidate")}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Conversation list — only wide enough to earn its place at xl. */}
        <div className="hidden min-h-0 xl:block">{list}</div>

        {/* The conversation itself: always on screen at lg+, a tab below. */}
        <div
          className={cn(
            "min-h-0 lg:block lg:h-full",
            tab === "conversation" ? "block" : "hidden",
          )}
        >
          {conversation}
        </div>

        {/* Candidate context — a right rail at lg+, the other tab below. */}
        <div
          className={cn(
            "min-h-0 lg:block lg:h-full",
            tab === "candidate" ? "block" : "hidden",
          )}
        >
          {candidate}
        </div>
      </div>
    </div>
  );
}

function WorkspaceTab({
  active,
  label,
  unread = false,
  onSelect,
}: {
  active: boolean;
  label: string;
  unread?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-xs px-3 text-[12.5px] font-semibold transition-colors",
        active
          ? "bg-surface text-ink shadow-e1"
          : "text-ink-muted hover:text-ink",
      )}
    >
      {label}
      {unread && (
        <span
          aria-label="Unread messages"
          className="size-1.5 rounded-full bg-blue"
        />
      )}
    </button>
  );
}
