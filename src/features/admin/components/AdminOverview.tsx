"use client";

import { PageHeader } from "@/shared/ui-components/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import {
  AttentionRow,
  Panel,
  PanelGroup,
  StatCard,
  type AttentionItem,
} from "@/shared/ui-components/dashboard/DashboardParts";
import { formatMinor } from "@/shared/utils/money";
import {
  useAdminCompanies,
  useAdminJobs,
  useAdminRecruiters,
  useAdminStats,
} from "../hooks/useAdmin";

function shortMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "short" },
  );
}

/** A legend key: the mark the series is drawn with, then its name. */
function LegendKey({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={swatch} />
      {label}
    </span>
  );
}

/** Two-segment bar comparing active vs held accounts for one population. */
function StatusBar({
  label,
  active,
  held,
}: {
  label: string;
  active: number;
  held: number;
}) {
  const total = active + held || 1;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-block font-[550] text-ink">{label}</span>
        <span className="text-meta tabular-nums text-ink-muted">
          {active} active · {held} suspended
        </span>
      </div>
      {/* `.splitbar` — one 8px rail split by share, never two bars. */}
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-sunken">
        <span
          className="bg-ok"
          style={{ width: `${(active / total) * 100}%` }}
        />
        <span
          className="bg-bad"
          style={{ width: `${(held / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** The admin dashboard: marketplace health, sign-ups, and the decision queue. */
export function AdminOverview() {
  const stats = useAdminStats();
  const liveJobs = useAdminJobs({ page: 1, status: "published", limit: 1 });
  const pendingRecruiters = useAdminRecruiters({
    page: 1,
    verificationStatus: "pending",
    limit: 1,
  });
  const pendingCompanies = useAdminCompanies({
    page: 1,
    verificationStatus: "pending",
    limit: 1,
  });
  const companies = useAdminCompanies({ page: 1, limit: 100 });

  const banner = (
    <PageHeader
      eyebrow="Marketplace overview"
      title="Admin Dashboard"
      subtitle={
        stats.data
          ? `${stats.data.recruiters.total} Recruiters · ${stats.data.companies.total} Companies · ${liveJobs.data?.meta.total ?? 0} Live Jobs`
          : "Marketplace health at a glance."
      }
    />
  );

  if (stats.isPending) {
    return (
      <div className="flex flex-col gap-4">
        {banner}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            /* A `StatCard`'s three stacked lines — label, figure, hint — on
               the same white card, so the strip does not resize when the
               numbers land. */
            <div
              key={i}
              aria-hidden="true"
              className="flex h-24 flex-col justify-center gap-2 rounded-md border border-line bg-surface px-4 shadow-e1"
            >
              <div className="h-3 w-20 animate-pulse rounded-xs bg-surface-sunken" />
              <div className="h-6 w-14 animate-pulse rounded-xs bg-surface-sunken" />
              <div className="h-3 w-24 animate-pulse rounded-xs bg-surface-sunken" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <div className="flex flex-col gap-4">
        {banner}
        <div className="rounded-md border border-line bg-surface p-4 text-sub text-ink-muted shadow-e1">
          Analytics are unavailable right now.
        </div>
      </div>
    );
  }

  const data = stats.data;
  const liveJobsTotal = liveJobs.data?.meta.total ?? 0;
  const peak = data.signups.reduce(
    (best, entry) => (entry.companies > best.companies ? entry : best),
    data.signups[0] ?? { month: "", recruiters: 0, companies: 0 },
  );
  const signupData = data.signups.map((entry) => ({
    month: shortMonth(entry.month),
    recruiters: entry.recruiters,
    companies: entry.companies,
  }));
  // Bars are drawn as a share of the tallest month, so a quiet six months still
  // fills the plot. The floor of 1 keeps an all-zero history from dividing by 0.
  const signupPeak = signupData.reduce(
    (tallest, entry) => Math.max(tallest, entry.companies, entry.recruiters),
    1,
  );

  const pending = pendingRecruiters.data?.meta.total ?? 0;
  const pendingCompanyCount = pendingCompanies.data?.meta.total ?? 0;
  const heldAccounts = data.recruiters.held + data.companies.held;
  const unfunded = (companies.data?.data ?? []).filter(
    (c) => c.balanceMinor === 0,
  ).length;

  const queue: AttentionItem[] = [];
  if (pending > 0) {
    queue.push({
      id: "pending",
      tone: "blue",
      title: `${pending} recruiter verification${pending === 1 ? "" : "s"} pending`,
      detail: "Recruiters can't access the marketplace until reviewed.",
      actionLabel: "Review",
      href: "/admin/recruiters",
    });
  }
  if (pendingCompanyCount > 0) {
    queue.push({
      id: "pending-companies",
      tone: "blue",
      title: `${pendingCompanyCount} company verification${pendingCompanyCount === 1 ? "" : "s"} pending`,
      detail: "Companies can't post jobs or review candidates until reviewed.",
      actionLabel: "Review",
      href: "/admin/companies",
    });
  }
  if (unfunded > 0) {
    queue.push({
      id: "unfunded",
      tone: "amber",
      title: `${unfunded} compan${unfunded === 1 ? "y has" : "ies have"} never funded a wallet`,
      detail: "They cannot publish a job until they do.",
      actionLabel: "See list",
      href: "/admin/companies",
    });
  }
  if (heldAccounts > 0) {
    queue.push({
      id: "held",
      tone: "muted",
      title: `${heldAccounts} account${heldAccounts === 1 ? "" : "s"} suspended`,
      detail: `${data.recruiters.held} recruiters and ${data.companies.held} companies await a decision.`,
      actionLabel: "Review",
      href: "/admin/recruiters",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {banner}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Wallet total"
          value={formatMinor(data.walletTotalMinor)}
          hint={`across ${data.companies.total} company wallets`}
        />
        <StatCard
          label="Recruiters"
          value={data.recruiters.total}
          hint={`${data.recruiters.active} active · ${data.recruiters.held} suspended`}
        />
        <StatCard
          label="Companies"
          value={data.companies.total}
          hint={`${data.companies.active} active · ${data.companies.held} suspended`}
        />
        <StatCard
          label="Live jobs"
          value={liveJobsTotal}
          hint={`${data.conversations} submissions to date`}
        />
        <StatCard
          label="Average fee"
          value={formatMinor(data.avgFeeMinor)}
          hint="across all live jobs"
        />
      </div>

      <PanelGroup
        gridClassName="lg:grid-cols-3"
        primaryId="decisions"
        panels={[
          {
            id: "signups",
            label: "Sign-ups",
            className: "lg:col-span-2",
            content: (
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <div className="min-w-0">
                    <CardTitle>Sign-ups</CardTitle>
                    <CardDescription className="mt-[3px]">
                      {peak.companies > 0
                        ? `Last 6 months · ${peak.companies} of ${data.companies.total} companies joined in ${shortMonth(peak.month)}`
                        : "Last 6 months"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-meta text-ink-muted sm:ml-auto">
                    <LegendKey
                      swatch="size-2 rounded-[2px] bg-navy"
                      label="Companies"
                    />
                    <LegendKey
                      swatch="size-2 rounded-[2px] bg-blue/85"
                      label="Recruiters"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  {/* `.barchart` — paired bars per month, drawn in CSS so the
                      page carries no charting runtime. */}
                  <div className="flex h-[190px] items-end gap-[18px] px-1.5 pt-2">
                    {signupData.map((entry) => (
                      <div
                        key={entry.month}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                      >
                        <div className="flex h-full items-end gap-1">
                          <div
                            title={`Companies: ${entry.companies}`}
                            className="w-4 rounded-t-[3px] bg-navy"
                            style={{
                              height: `${(entry.companies / signupPeak) * 100}%`,
                            }}
                          />
                          <div
                            title={`Recruiters: ${entry.recruiters}`}
                            className="w-4 rounded-t-[3px] bg-blue/85"
                            style={{
                              height: `${(entry.recruiters / signupPeak) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-label text-ink-faint">
                          {entry.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            id: "status",
            label: "Account Status",
            content: (
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>
                    {heldAccounts} of{" "}
                    {data.recruiters.total + data.companies.total} accounts are
                    suspended.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <StatusBar
                    label="Companies"
                    active={data.companies.active}
                    held={data.companies.held}
                  />
                  <StatusBar
                    label="Recruiters"
                    active={data.recruiters.active}
                    held={data.recruiters.held}
                  />
                  <div className="mt-auto flex items-center gap-3 pt-2 text-meta text-ink-muted">
                    <LegendKey
                      swatch="size-2 rounded-full bg-ok"
                      label="Active"
                    />
                    <LegendKey
                      swatch="size-2 rounded-full bg-bad"
                      label="Suspended"
                    />
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            id: "decisions",
            label: "Need Decision",
            className: "lg:col-span-3",
            content: (
              <Panel title="Need Decision">
                {queue.length > 0 ? (
                  <div className="flex flex-col">
                    {queue.map((item) => (
                      <AttentionRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-sub text-ink-muted">
                    Nothing waiting on a decision right now.
                  </p>
                )}
              </Panel>
            ),
          },
        ]}
      />
    </div>
  );
}
