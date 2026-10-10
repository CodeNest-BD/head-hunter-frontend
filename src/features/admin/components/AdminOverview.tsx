"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { TONE_DOT, type PillTone } from "@/shared/ui-components/badges/Pill";
import { ErrorRetryCallout } from "@/shared/ui-components/feedback/ErrorRetryCallout";

import { useAdminDashboard, useAdminStats } from "../hooks/useAdmin";
import type { AdminStats, DashboardEvent, DashboardQueue } from "../schemas";
import {
  ListHead,
  PriorityChip,
  Section,
  SectionHead,
  Segmented,
} from "./dashboard/DashboardPieces";
import { QUEUE_PRESENTATION } from "./dashboard/queuePresentation";

const SCOPES = [
  { value: "all" as const, label: "All" },
  { value: "urgent" as const, label: "Urgent" },
];

const ACTIVITY_FILTERS = [
  { value: "all", label: "All events" },
  { value: "dispute", label: "Disputes" },
  { value: "money", label: "Payments" },
  { value: "account", label: "Accounts" },
  { value: "hiring", label: "Hiring" },
] as const;

const EVENT_TONE: Record<DashboardEvent["kind"], PillTone> = {
  dispute: "warn",
  money: "ok",
  account: "info",
  hiring: "info",
};

function shortMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "short" },
  );
}

/** "Friday, October 9, 2026" — the design's own dateline. */
function today(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Today's events keep a clock; older ones name the day. */
function eventTime(iso: string): string {
  const at = new Date(iso);
  const sameDay = at.toDateString() === new Date().toDateString();
  return sameDay
    ? at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── KPI band ───────────────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  note,
  tone,
  href,
}: {
  label: string;
  value: string;
  note: string;
  tone: PillTone;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 px-6 py-5 text-ink shadow-[inset_-1px_0_0_theme(colors.line.DEFAULT)] transition-colors last:shadow-none hover:bg-surface-sub"
    >
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-ink-muted">
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", TONE_DOT[tone])}
        />
        {label}
      </span>
      <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums">
        {value}
      </span>
      <span className="text-meta leading-[18px] text-ink-muted">{note}</span>
    </Link>
  );
}

function KpiBand({ stats }: { stats: AdminStats }) {
  const kpis = [
    {
      label: "Wallet Total",
      value: formatMinor(stats.walletTotalMinor),
      note: `${formatMinor(stats.walletAvailableMinor)} available · ${formatMinor(stats.walletReservedMinor)} reserved`,
      tone: "ok" as const,
      href: "/admin/companies",
    },
    {
      label: "Recruiters",
      value: stats.recruiters.total.toLocaleString(),
      note: `${stats.recruiters.verified.toLocaleString()} verified & active`,
      tone: "info" as const,
      href: "/admin/recruiters",
    },
    {
      label: "Companies",
      value: stats.companies.total.toLocaleString(),
      note: `${stats.companies.approved.toLocaleString()} approved & active`,
      tone: "info" as const,
      href: "/admin/companies",
    },
    {
      label: "Live Jobs",
      value: stats.liveJobs.toLocaleString(),
      note: `${stats.scheduledJobs} interviewing · ${stats.offerJobs} at offer`,
      tone: "info" as const,
      href: "/admin/jobs",
    },
    {
      label: "Average Fee",
      value: formatMinor(stats.avgFeeMinor),
      note: `Across live jobs · ${formatMinor(stats.feeMinMinor)} – ${formatMinor(stats.feeMaxMinor)}`,
      tone: "neutral" as const,
      href: "/admin/jobs",
    },
  ];

  return (
    <Section label="Marketplace summary">
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>
      {/* The figures carry definitions a reader will ask about once and then
          never again, so they fold away rather than taking a line each. */}
      <details className="bg-surface-sub px-6 py-2.5 text-meta text-ink-muted shadow-[inset_0_1px_0_theme(colors.line.DEFAULT)]">
        <summary className="cursor-pointer font-medium text-blue-ink">
          How these are calculated
        </summary>
        <p className="mb-1 mt-1.5 max-w-[760px] leading-[18px]">
          Wallet Total sums current company balances; reserved funds are counted
          once and past deposits are excluded. Live Jobs are published jobs
          accepting submissions. Average Fee is the mean recruiter fee across
          live jobs.
        </p>
      </details>
    </Section>
  );
}

// ── Needs your attention ───────────────────────────────────────────────────

function QueueRow({ queue }: { queue: DashboardQueue }) {
  const p = QUEUE_PRESENTATION[queue.key];
  const Icon = p.icon;
  const TINT: Record<PillTone, string> = {
    ok: "bg-ok-bg text-ok",
    warn: "bg-warn-bg text-warn",
    bad: "bg-bad-bg text-bad",
    info: "bg-info-bg text-info",
    violet: "bg-violet-bg text-violet",
    neutral: "bg-neutral-bg text-neutral",
    blue: "bg-info-bg text-info",
  };

  return (
    <div
      role="row"
      className="grid min-h-[68px] items-center gap-4 px-6 shadow-[inset_0_-1px_0_theme(colors.line.row)] transition-colors hover:bg-surface-sub [grid-template-columns:minmax(0,1fr)_128px_64px_92px]"
    >
      <span role="cell" className="flex min-w-0 items-center gap-3.5">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[34px] shrink-0 items-center justify-center rounded-sm",
            TINT[p.tone],
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-body font-medium text-ink">{p.label}</span>
          <span className="truncate text-meta text-ink-muted">
            {queue.context}
          </span>
        </span>
      </span>
      <span role="cell">
        <PriorityChip tone={p.tone}>{p.priorityLabel}</PriorityChip>
      </span>
      <span
        role="cell"
        className="text-right text-[16px] font-semibold tabular-nums text-ink"
      >
        {queue.count}
      </span>
      <span role="cell" className="text-right">
        <Button asChild variant="outline" size="xs">
          <Link href={p.href}>Review</Link>
        </Button>
      </span>
    </div>
  );
}

function AttentionPanel({ queues }: { queues: DashboardQueue[] }) {
  const [scope, setScope] = useState<"all" | "urgent">("all");
  const urgent = queues.filter((q) => q.urgent);
  const shown = scope === "urgent" ? urgent : queues;

  return (
    <Section label="Work queues">
      <SectionHead
        title="Needs your attention"
        sub="Urgent = payout eligible within 3 days, or waiting on Admin for over 48 hours"
        action={
          <Segmented
            label="Show"
            value={scope}
            onChange={setScope}
            options={SCOPES.map((s) => ({
              ...s,
              label: `${s.label} · ${s.value === "urgent" ? urgent.length : queues.length}`,
            }))}
          />
        }
      />
      <div role="table" aria-label="Work queues">
        <ListHead columns={["Queue", "Priority", "Items", "Action"]} />
        {shown.map((q) => (
          <QueueRow key={q.key} queue={q} />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="px-6 py-7 text-center text-sub text-ink-muted">
          Nothing urgent right now.
        </p>
      )}
    </Section>
  );
}

// ── Money ──────────────────────────────────────────────────────────────────

function MoneyBlock({
  label,
  value,
  count,
  note,
  tone,
  href,
}: {
  label: string;
  value: string;
  count: string;
  note: string;
  tone: "warn" | "info" | "ok";
  href: string;
}) {
  const SKIN = {
    warn: "bg-warn-bg shadow-[inset_0_0_0_1px_theme(colors.warn.line)] text-warn",
    info: "bg-info-bg shadow-[inset_0_0_0_1px_theme(colors.info.line)] text-info",
    ok: "bg-ok-bg shadow-[inset_0_0_0_1px_theme(colors.ok.line)] text-ok",
  } as const;

  return (
    <Link
      href={href}
      className={cn("flex flex-col gap-1 rounded-md p-4", SKIN[tone])}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase leading-4 tracking-[0.06em]">
          {label}
        </span>
        <span className="text-meta text-ink-muted">{count}</span>
      </span>
      <span className="text-stat font-semibold tabular-nums text-ink">
        {value}
      </span>
      <span className="text-meta text-ink-muted">{note}</span>
    </Link>
  );
}

function MoneyPanel({
  money,
}: {
  money: NonNullable<ReturnType<typeof useAdminDashboard>["data"]>["money"];
}) {
  return (
    <Section label="Money" className="flex flex-col gap-3 px-5 pb-5 pt-[18px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[16px] font-semibold leading-5 text-ink">Money</h2>
        <span className="flex gap-3 text-sub font-medium">
          <Link
            href="/admin/companies"
            className="text-blue-ink hover:underline"
          >
            Company payments
          </Link>
          <Link
            href="/admin/disputes"
            className="text-blue-ink hover:underline"
          >
            Recruiter payouts
          </Link>
        </span>
      </div>

      <MoneyBlock
        tone="warn"
        label="On hold"
        value={formatMinor(money.onHold.amountMinor)}
        count={`${money.onHold.count} payouts`}
        note={`${money.onHold.disputeHolds} dispute holds · ${money.onHold.manualHolds} past guarantee`}
        href="/admin/disputes"
      />
      <MoneyBlock
        tone="info"
        label="Due in 14 days"
        value={formatMinor(money.dueSoon.amountMinor)}
        count={`${money.dueSoon.count} payouts`}
        note="Releases when each guarantee completes"
        href="/admin/disputes"
      />
      <MoneyBlock
        tone="ok"
        label="Paid · last 30 days"
        value={formatMinor(money.paidRecently.amountMinor)}
        count={`${money.paidRecently.count} confirmed`}
        note="Confirmed by the payment provider"
        href="/admin/disputes"
      />

      <dl className="mt-1">
        {[
          {
            label: "Refunds to companies",
            note: `${money.refundedRecently.count} · 30 days`,
            value: formatMinor(money.refundedRecently.amountMinor),
            bad: false,
          },
          {
            label: "Failed payouts",
            note: `${money.failedPayouts.count} needs action`,
            value: formatMinor(money.failedPayouts.amountMinor),
            bad: money.failedPayouts.count > 0,
          },
        ].map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 px-0.5 py-2.5 shadow-[inset_0_-1px_0_theme(colors.line.row)]"
          >
            <dt className="text-sub text-ink-body">
              {r.label} <span className="text-ink-muted">· {r.note}</span>
            </dt>
            <dd
              className={cn(
                "text-body font-semibold tabular-nums",
                r.bad ? "text-bad" : "text-ink",
              )}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-meta leading-[18px] text-ink-muted">
        Payouts are marked paid only after the provider confirms. A dispute
        pauses the payment, not the 30-day guarantee clock.
      </p>
    </Section>
  );
}

// ── Recent activity ────────────────────────────────────────────────────────

function ActivityPanel({ activity }: { activity: DashboardEvent[] }) {
  const [filter, setFilter] = useState<string>("all");
  const shown =
    filter === "all" ? activity : activity.filter((e) => e.kind === filter);

  return (
    <Section label="Recent activity">
      <SectionHead
        title="Recent activity"
        className="pb-3"
        action={
          <select
            aria-label="Filter activity"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={cn(
              "h-8 rounded-sm border px-2.5 text-meta font-medium",
              filter === "all"
                ? "border-line-strong bg-surface text-ink"
                : "border-info-line bg-info-bg text-blue-ink",
            )}
          >
            {ACTIVITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        }
      />
      {shown.length === 0 ? (
        <p className="px-6 py-7 text-center text-sub text-ink-muted">
          Nothing here yet.
        </p>
      ) : (
        <ol>
          {shown.map((e, i) => (
            <li
              key={`${e.at}-${i}`}
              className="flex items-start gap-3 px-6 py-3 shadow-[inset_0_1px_0_theme(colors.line.row)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full ring-[3px]",
                  TONE_DOT[EVENT_TONE[e.kind]],
                  EVENT_TONE[e.kind] === "warn"
                    ? "ring-warn-bg"
                    : EVENT_TONE[e.kind] === "ok"
                      ? "ring-ok-bg"
                      : "ring-info-bg",
                )}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sub">
                  <span className="font-medium text-ink">{e.title}</span>{" "}
                  <span className="text-ink-body">{e.detail}</span>
                </span>
                <span className="text-meta text-ink-muted">{e.actor}</span>
              </span>
              <span className="whitespace-nowrap text-meta tabular-nums text-ink-muted">
                {eventTime(e.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="px-6 py-3 shadow-[inset_0_1px_0_theme(colors.line.DEFAULT)]">
        <Link
          href="/admin/settings"
          className="text-sub font-medium text-blue-ink hover:underline"
        >
          View full audit log →
        </Link>
      </div>
    </Section>
  );
}

// ── Growth ─────────────────────────────────────────────────────────────────

const CHART_H = 128;

function LegendKey({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-[2px]", swatch)} aria-hidden="true" />
      {label}
    </span>
  );
}

function AccountBar({
  label,
  activeLabel,
  active,
  pending,
  suspended,
}: {
  label: string;
  activeLabel: string;
  active: number;
  pending: number;
  suspended: number;
}) {
  const total = Math.max(active + pending + suspended, 1);
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sub font-medium text-ink">{label}</span>
        <span className="text-meta tabular-nums text-ink-muted">
          {(active + pending + suspended).toLocaleString()} total
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${active} ${activeLabel.toLowerCase()}, ${pending} pending, ${suspended} suspended`}
        className="flex h-1.5 overflow-hidden rounded-full bg-neutral-bg"
      >
        <span className="bg-ok-dot" style={{ width: pct(active) }} />
        <span className="bg-info-dot" style={{ width: pct(pending) }} />
        <span className="bg-warn-dot" style={{ width: pct(suspended) }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-muted">
        <LegendKey swatch="bg-ok-dot" label={`${activeLabel} ${active}`} />
        <LegendKey swatch="bg-info-dot" label={`Pending ${pending}`} />
        <LegendKey swatch="bg-warn-dot" label={`Suspended ${suspended}`} />
      </div>
    </div>
  );
}

function GrowthPanel({ stats }: { stats: AdminStats }) {
  const max = Math.max(
    1,
    ...stats.signups.map((s) => Math.max(s.recruiters, s.companies)),
  );
  const bar = (n: number) => Math.round((n / max) * CHART_H);

  return (
    <Section label="Growth">
      <SectionHead
        title="Sign-ups · last 6 months"
        className="pb-1"
        action={
          <div className="flex gap-4 text-meta text-ink-body">
            <LegendKey swatch="bg-blue" label="Recruiters" />
            <LegendKey swatch="bg-tint-strong" label="Companies" />
          </div>
        }
      />
      <div className="px-6 pb-5 pt-3">
        <div
          role="img"
          aria-label={`Monthly sign-ups. ${stats.signups
            .map(
              (s) =>
                `${shortMonth(s.month)}: ${s.recruiters} recruiters, ${s.companies} companies`,
            )
            .join("; ")}`}
          className="grid h-[170px] items-end gap-3 shadow-[inset_0_-1px_0_theme(colors.line.head)]"
          style={{
            gridTemplateColumns: `repeat(${stats.signups.length || 1}, minmax(0,1fr))`,
          }}
        >
          {stats.signups.map((s) => (
            <div
              key={s.month}
              className="flex h-full items-end justify-center gap-1"
            >
              {[
                { n: s.recruiters, fill: "bg-blue" },
                { n: s.companies, fill: "bg-tint-strong" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] tabular-nums text-ink-muted">
                    {b.n}
                  </span>
                  <div
                    className={cn("w-[18px] rounded-t-[4px]", b.fill)}
                    style={{ height: `${bar(b.n)}px` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          className="mt-2 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${stats.signups.length || 1}, minmax(0,1fr))`,
          }}
        >
          {stats.signups.map((s) => (
            <span
              key={s.month}
              className="text-center text-meta text-ink-muted"
            >
              {shortMonth(s.month)}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4">
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-ink-muted">
            Account status
          </p>
          <AccountBar
            label="Recruiters"
            activeLabel="Verified"
            active={stats.recruiters.verified}
            pending={stats.recruiters.pending}
            suspended={stats.recruiters.held}
          />
          <AccountBar
            label="Companies"
            activeLabel="Approved"
            active={stats.companies.approved}
            pending={stats.companies.pending}
            suspended={stats.companies.held}
          />
        </div>
      </div>
    </Section>
  );
}

// ── The screen ─────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-[132px] animate-pulse rounded-lg bg-surface shadow-e1" />
      <div className="grid gap-6 lg:[grid-template-columns:minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="h-[460px] animate-pulse rounded-lg bg-surface shadow-e1" />
        <div className="h-[460px] animate-pulse rounded-lg bg-surface shadow-e1" />
      </div>
    </div>
  );
}

/** The admin dashboard, as the phase-2 redesign lays it out. */
export function AdminOverview() {
  const stats = useAdminStats();
  const dashboard = useAdminDashboard();

  if (stats.isPending || dashboard.isPending) return <Skeleton />;
  if (stats.isError || dashboard.isError) {
    return (
      <ErrorRetryCallout
        message="Could not load the dashboard."
        onRetry={() => {
          void stats.refetch();
          void dashboard.refetch();
        }}
      />
    );
  }

  const urgentCount = dashboard.data.queues.filter((q) => q.urgent).length;
  const needing = dashboard.data.queues.filter((q) => q.count > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-page font-semibold text-ink">Dashboard</h1>
          <p className="text-sub text-ink-muted">
            {today()} · {needing} queues need you, {urgentCount} of them urgent
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/disputes">Open Dispute Center</Link>
        </Button>
      </header>

      <KpiBand stats={stats.data} />

      <div className="grid gap-6 lg:[grid-template-columns:minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
        <AttentionPanel queues={dashboard.data.queues} />
        <MoneyPanel money={dashboard.data.money} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ActivityPanel activity={dashboard.data.activity} />
        <GrowthPanel stats={stats.data} />
      </div>
    </div>
  );
}
