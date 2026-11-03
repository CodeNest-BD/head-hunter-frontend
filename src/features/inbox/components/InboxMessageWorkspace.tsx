"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The height DashboardLayout's chrome always takes: the 4rem navbar plus
 * main's pt-6 (1.5rem) and pb-16 (4rem) — 9.5rem. The workspace fills exactly
 * what's left so the page never scrolls; each panel scrolls on its own.
 * `dvh` below `lg` so a mobile URL bar can't push the composer off-screen.
 */
const WORKSPACE_HEIGHT = "h-[calc(100dvh-9.5rem)] lg:h-[calc(100vh-9.5rem)]";

/**
 * The two breakpoints the *markup* turns on, not just its styling — which is
 * what `useMediaQuery` is for. Written as max-widths so the server snapshot
 * (`false`) describes the widest layout, per that hook's contract.
 */
const BELOW_LG = "(max-width: 1023px)";
const BELOW_XL = "(max-width: 1279px)";

/**
 * Where the columns sit before anyone drags them, as percentages — the shape
 * the fixed `280px` / `380px` / `400px` tracks had at a typical desktop width.
 * The minimums are the point at which a column stops being readable rather
 * than merely narrow: a thread whose bubbles have wrapped to one word a line
 * is worse than no thread.
 */
const LAYOUT = {
  three: { list: 18, candidate: 56, conversation: 26 },
  two: { candidate: 68, conversation: 32 },
} as const;

/**
 * The grab bar between two panels.
 *
 * Occupies exactly the 12px the `gap-3` between the columns used to, so
 * nothing shifts: the line only appears on hover, drag or keyboard focus, and
 * the full 12px stays grabbable rather than asking for a 1px target.
 */
function WorkspaceResizer({ label }: { label: string }) {
  return (
    <PanelResizeHandle
      aria-label={label}
      // `cursor-col-resize` is the affordance: the bar is invisible at rest so
      // the columns keep their clean gap, which leaves the cursor as the only
      // thing telling a reader the seam can be dragged. The library sets a
      // global cursor once a drag starts, not before it.
      className="group relative flex w-3 shrink-0 cursor-col-resize items-center justify-center outline-none"
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-full w-px rounded-full bg-transparent transition-colors",
          "group-hover:bg-line-strong",
          "group-data-[resize-handle-state=drag]:w-0.5",
          "group-data-[resize-handle-state=drag]:bg-blue",
          "group-focus-visible:w-0.5 group-focus-visible:bg-blue",
        )}
      />
    </PanelResizeHandle>
  );
}

/**
 * The message-view workspace: the conversation list, the candidate and the
 * open conversation as three equal-height panels of one surface — not
 * floating cards. The candidate is the featured middle column, since judging
 * them is why the page is open; the conversation is a narrower right rail from
 * `lg`. `list` shows only at `xl` (there's a full inbox a click away). Below
 * `lg` the candidate and conversation become tabs so a phone shows one at a
 * time without burying either.
 */
export function InboxMessageWorkspace({
  list,
  conversation,
  candidate,
  conversationUnread = false,
  backHref,
}: {
  list: ReactNode;
  conversation: ReactNode;
  candidate: ReactNode;
  conversationUnread?: boolean;
  backHref: string;
}) {
  const [tab, setTab] = useState<"conversation" | "candidate">("candidate");
  const isBelowLg = useMediaQuery(BELOW_LG);
  const isBelowXl = useMediaQuery(BELOW_XL);

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
            active={tab === "candidate"}
            label="Candidate"
            onSelect={() => setTab("candidate")}
          />
          <WorkspaceTab
            active={tab === "conversation"}
            label="Conversation"
            unread={conversationUnread}
            onSelect={() => setTab("conversation")}
          />
        </div>
      </div>

      {isBelowLg ? (
        /* One panel at a time, chosen by the tabs above. */
        <div className="min-h-0 flex-1">
          <div
            className={cn("h-full", tab === "candidate" ? "block" : "hidden")}
          >
            {candidate}
          </div>
          <div
            className={cn(
              "h-full",
              tab === "conversation" ? "block" : "hidden",
            )}
          >
            {conversation}
          </div>
        </div>
      ) : (
        /* Remounted when the column count changes, because a panel group's
           set of panels is fixed for its lifetime — and each width is saved
           under its own id, so the two- and three-column layouts remember
           themselves separately instead of overwriting each other. */
        <PanelGroup
          key={isBelowXl ? "two-column" : "three-column"}
          autoSaveId={
            isBelowXl ? "hh-inbox-workspace-2" : "hh-inbox-workspace-3"
          }
          direction="horizontal"
          className="min-h-0 flex-1"
        >
          {/* The conversation list earns its place only at xl — there is a
              full inbox one click away. */}
          {!isBelowXl && (
            <>
              <Panel
                id="list"
                order={1}
                defaultSize={LAYOUT.three.list}
                minSize={12}
                maxSize={34}
                className="min-h-0"
              >
                {list}
              </Panel>
              <WorkspaceResizer label="Resize the conversation list" />
            </>
          )}

          {/* The candidate: the featured column, since judging them is why
              the page is open. */}
          <Panel
            id="candidate"
            order={2}
            defaultSize={
              isBelowXl ? LAYOUT.two.candidate : LAYOUT.three.candidate
            }
            minSize={30}
            className="min-h-0"
          >
            {candidate}
          </Panel>

          <WorkspaceResizer label="Resize the candidate panel" />

          <Panel
            id="conversation"
            order={3}
            defaultSize={
              isBelowXl ? LAYOUT.two.conversation : LAYOUT.three.conversation
            }
            minSize={20}
            className="min-h-0"
          >
            {conversation}
          </Panel>
        </PanelGroup>
      )}
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
