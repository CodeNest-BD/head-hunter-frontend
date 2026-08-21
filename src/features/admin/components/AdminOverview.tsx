"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageBanner } from "@/shared/ui-components/brand";
import {
  AttentionRow,
  Panel,
  StatCard,
  type AttentionItem,
} from "@/shared/ui-components/dashboard/dashboard-parts";
import { formatMinor } from "@/shared/utils/money";
import {
  useAdminCompanies,
  useAdminJobs,
  useAdminRecruiters,
  useAdminStats,
} from "../hooks/useAdmin";

const RECRUITER_COLOR = "#034AEF";
const COMPANY_COLOR = "#0A1738";
const ACTIVE_COLOR = "#17734E";
const HELD_COLOR = "#9B3535";

function shortMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "short" },
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
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-navy">{label}</span>
        <span className="text-muted-foreground">
          {active} active · {held} held
        </span>
      </div>
      <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-muted">
        <span
          className="bg-[#17734E]"
          style={{ width: `${(active / total) * 100}%` }}
        />
        <span
          className="bg-[#9B3535]"
          style={{ width: `${(held / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** The admin dashboard: marketplace health, sign-ups, and the decision queue. */
export function AdminOverview({ firstName }: { firstName: string }) {
  const stats = useAdminStats();
  const liveJobs = useAdminJobs({ page: 1, status: "published", limit: 1 });
  const pendingRecruiters = useAdminRecruiters({
    page: 1,
    verificationStatus: "pending",
    limit: 1,
  });
  const companies = useAdminCompanies({ page: 1, limit: 100 });

  const banner = (
    <PageBanner
      size="lg"
      eyebrow="Marketplace overview"
      title={`Hey ${firstName}`}
      subtitle={
        stats.data
          ? `${stats.data.recruiters.total} recruiters · ${stats.data.companies.total} companies · ${liveJobs.data?.meta.total ?? 0} live jobs`
          : "Marketplace health at a glance."
      }
    />
  );

  if (stats.isPending) {
    return (
      <div className="flex flex-col gap-6">
        {banner}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-md border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <div className="flex flex-col gap-6">
        {banner}
        <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
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
  const signupData = data.signups.map((s) => ({
    month: shortMonth(s.month),
    Recruiters: s.recruiters,
    Companies: s.companies,
  }));

  const pending = pendingRecruiters.data?.meta.total ?? 0;
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
      title: `${heldAccounts} account${heldAccounts === 1 ? "" : "s"} on hold`,
      detail: `${data.recruiters.held} recruiters and ${data.companies.held} companies await a decision.`,
      actionLabel: "Review",
      href: "/admin/recruiters",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {banner}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="navy"
          label="Wallet total"
          value={formatMinor(data.walletTotalMinor)}
          hint={`across ${data.companies.total} company wallets`}
        />
        <StatCard
          label="Recruiters"
          value={data.recruiters.total}
          hint={`${data.recruiters.active} active · ${data.recruiters.held} held`}
        />
        <StatCard
          label="Companies"
          value={data.companies.total}
          hint={`${data.companies.active} active · ${data.companies.held} held`}
        />
        <StatCard
          label="Live jobs"
          value={liveJobsTotal}
          hint={`${data.conversations} submissions to date`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6 lg:col-span-2">
          <h2 className="font-heading text-base font-bold text-navy">
            Sign-ups
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {peak.companies > 0
              ? `Last 6 months · ${peak.companies} of ${data.companies.total} companies joined in ${shortMonth(peak.month)}`
              : "Last 6 months"}
          </p>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={signupData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E3E6EC"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#68707E" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#68707E" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E3E6EC",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar
                  dataKey="Companies"
                  fill={COMPANY_COLOR}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Recruiters"
                  fill={RECRUITER_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-heading text-base font-bold text-navy">
            Account status
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {heldAccounts} of {data.recruiters.total + data.companies.total}{" "}
            accounts are on hold.
          </p>
          <div className="mt-5 flex flex-col gap-4">
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
          </div>
          <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ACTIVE_COLOR }}
              />
              Active
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: HELD_COLOR }}
              />
              Held
            </span>
          </div>
        </section>
      </div>

      <Panel title="Needs a decision">
        {queue.length > 0 ? (
          <div className="flex flex-col">
            {queue.map((item) => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">
            Nothing waiting on a decision right now.
          </p>
        )}
      </Panel>
    </div>
  );
}
