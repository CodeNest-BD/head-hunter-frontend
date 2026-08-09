"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Building2,
  Users,
  Wallet2,
  type LucideIcon,
} from "lucide-react";

import { formatMinor } from "@/shared/utils/money";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { useAdminStats } from "../hooks/useAdmin";

const RECRUITER_COLOR = "#2050E0";
const COMPANY_COLOR = "#14213D";
const ACTIVE_COLOR = "#17734E";
const HELD_COLOR = "#9B3535";

function shortMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "short" },
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Analytics band on the admin dashboard: headline counts + two charts. */
export function AdminOverview() {
  const { data, isPending, isError } = useAdminStats();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Analytics are unavailable right now.
        </CardContent>
      </Card>
    );
  }

  const signupData = data.signups.map((s) => ({
    month: shortMonth(s.month),
    Recruiters: s.recruiters,
    Companies: s.companies,
  }));
  const statusData = [
    {
      name: "Active",
      value: data.recruiters.active + data.companies.active,
      color: ACTIVE_COLOR,
    },
    {
      name: "Held",
      value: data.recruiters.held + data.companies.held,
      color: HELD_COLOR,
    },
  ];
  const anyStatus = statusData.some((s) => s.value > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Recruiters"
          value={String(data.recruiters.total)}
          hint={`${data.recruiters.active} active · ${data.recruiters.held} held`}
        />
        <StatCard
          icon={Building2}
          label="Companies"
          value={String(data.companies.total)}
          hint={`${data.companies.active} active · ${data.companies.held} held`}
        />
        <StatCard
          icon={BadgeCheck}
          label="Subscriptions"
          value={String(data.recruiters.subscribed)}
          hint="active recruiter subscriptions"
        />
        <StatCard
          icon={Wallet2}
          label="Wallet total"
          value={formatMinor(data.walletTotalMinor)}
          hint="across all company wallets"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Sign-ups (last 6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
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
                    dataKey="Recruiters"
                    fill={RECRUITER_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Companies"
                    fill={COMPANY_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {anyStatus ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E3E6EC",
                        fontSize: 13,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No accounts yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
