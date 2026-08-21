"use client";

import Link from "next/link";

import { useFollowedCompanies } from "@/features/companies";
import { useJobs } from "@/features/jobs";
import { useNotifications } from "@/features/notifications";
import { useRecruiterWallet } from "@/features/billing";
import { useSubmissions } from "@/features/submissions";
import { PageBanner } from "@/shared/ui-components/brand";
import {
  AttentionRow,
  Panel,
  StatCard,
  type AttentionItem,
} from "@/shared/ui-components/dashboard/DashboardParts";
import { formatDateTime } from "@/shared/utils/formatDate";
import { Money } from "@/shared/ui-components/data/MoneyVisibility";
import { formatMinor } from "@/shared/utils/money";
import { useMyRecruiterProfile } from "../hooks/useRecruiterProfile";

/** In-flight submissions — everything that isn't closed out. */
const ACTIVE_STATUSES = new Set(["submitted", "under_review", "advanced"]);
/** Under-review submissions older than this read as "stalled". */
const STALL_DAYS = 7;
const DAY_MS = 86_400_000;

export function RecruiterDashboard({ firstName }: { firstName: string }) {
  const profile = useMyRecruiterProfile();
  const submissions = useSubmissions({ limit: 50 });
  const wallet = useRecruiterWallet();
  const followed = useFollowedCompanies({ limit: 50 });
  const openRoles = useJobs({ limit: 5, sortBy: "publishedAt" });
  const activity = useNotifications({ limit: 6 });

  const references = profile.data?.references ?? [];
  const verificationStatus = profile.data?.verificationStatus;
  const yearsExperience = profile.data?.yearsExperience ?? null;

  const subs = submissions.data?.data ?? [];
  const activeCount = subs.filter((s) => ACTIVE_STATUSES.has(s.status)).length;
  const underReview = subs.filter((s) => s.status === "under_review");
  const stalled = underReview.filter(
    (s) => Date.now() - s.updatedAt.getTime() > STALL_DAYS * DAY_MS,
  );

  const followedTotal = followed.data?.meta.total ?? 0;
  const noCommissionCount = (followed.data?.data ?? []).filter(
    (c) =>
      c.commissionRangeMinMinor === null && c.commissionRangeMaxMinor === null,
  ).length;

  const openRolesTotal = openRoles.data?.meta.total ?? null;
  const latestRole = openRoles.data?.data[0] ?? null;

  const advanced = subs.filter((s) => s.status === "advanced").length;
  const activeSubmissionsHint =
    activeCount === 0
      ? "nothing in flight"
      : advanced > 0
        ? `${advanced} advanced`
        : underReview.length > 0
          ? `${underReview.length} under review`
          : "awaiting company review";

  const subtitleParts = [
    "Recruiter",
    verificationStatus === "verified"
      ? "verified"
      : verificationStatus === "rejected"
        ? "verification declined"
        : "pending verification",
    yearsExperience !== null
      ? `${yearsExperience} year${yearsExperience === 1 ? "" : "s"} experience`
      : null,
  ].filter(Boolean);

  // The attention feed is derived from real signals, ordered most-actionable
  // first, and capped so the card stays a glance, not a backlog.
  const attention: AttentionItem[] = [];
  if (verificationStatus && verificationStatus !== "verified") {
    attention.push({
      id: "verification",
      tone: "amber",
      title:
        verificationStatus === "rejected"
          ? "Your verification was declined"
          : "Your account is pending verification",
      detail:
        "Complete your profile and references, then an admin reviews your access.",
      actionLabel: "Review",
      href: "/recruiter/profile",
    });
  }
  if (latestRole) {
    attention.push({
      id: `role-${latestRole.id}`,
      tone: "blue",
      title: `${latestRole.title || "A new role"} just posted`,
      detail: `${latestRole.companyName || "A company"} · ${formatMinor(
        latestRole.recruiterFeeMinor,
      )} recruiter fee`,
      actionLabel: "Submit",
      href: `/jobs/${latestRole.id}`,
    });
  }
  if (stalled.length > 0) {
    attention.push({
      id: "stalled",
      tone: "amber",
      title: `${stalled.length} submission${stalled.length === 1 ? "" : "s"} under review for ${STALL_DAYS}+ days`,
      detail: "Follow up with the company to keep them moving.",
      actionLabel: "Open",
      href: "/recruiter/submissions",
    });
  }
  if (references.length < 3) {
    const missing = 3 - references.length;
    attention.push({
      id: "references",
      tone: "blue",
      title: `Add ${missing} more reference${missing === 1 ? "" : "s"}`,
      detail: "Admins check references when they review your account.",
      actionLabel: "Add",
      href: "/recruiter/profile",
    });
  }
  if (noCommissionCount > 0) {
    attention.push({
      id: "commission",
      tone: "muted",
      title: `${noCommissionCount} followed compan${noCommissionCount === 1 ? "y has" : "ies have"} no published commission`,
      detail: "Ask before you submit so the fee is agreed up front.",
      actionLabel: "Review",
      href: "/companies",
    });
  }

  const recentActivity = activity.data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title={`Hey ${firstName}`}
        subtitle={subtitleParts.join(" · ")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open roles"
          value={openRolesTotal ?? "—"}
          hint="open to you right now"
          href="/explore-jobs"
        />
        <StatCard
          label="Active submissions"
          value={submissions.isPending ? "—" : activeCount}
          // The hint has to describe the same set as the number. It used to read
          // "none open" whenever nothing was `under_review`, so a single
          // submitted candidate showed "1 · none open".
          hint={activeSubmissionsHint}
          href="/recruiter/submissions"
        />
        <StatCard
          label="In escrow"
          value={<Money minor={wallet.data?.inEscrowMinor ?? 0} />}
          hint={
            wallet.data && wallet.data.placementsCount > 0
              ? `across ${wallet.data.placementsCount} placement${wallet.data.placementsCount === 1 ? "" : "s"}`
              : "released 30 days after a start"
          }
          href="/recruiter/wallet"
        />
        <StatCard
          label="Companies followed"
          value={followed.isPending ? "—" : followedTotal}
          hint="you're alerted when they post"
          href="/companies"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Needs your attention"
          action={
            <Link
              href="/notifications"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View all
            </Link>
          }
        >
          {attention.length > 0 ? (
            <div className="flex flex-col">
              {attention.slice(0, 5).map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              You&apos;re all caught up — nothing needs your attention right
              now.
            </p>
          )}
        </Panel>

        <Panel title="Recent activity">
          {recentActivity.length > 0 ? (
            <ul className="flex flex-col">
              {recentActivity.map((note) => (
                <li
                  key={note.id}
                  className="border-b border-border/70 py-3.5 last:border-0"
                >
                  <p className="text-sm font-medium text-navy">{note.title}</p>
                  {note.body && (
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                      {note.body}
                    </p>
                  )}
                  {/* Date and time, not just the date: two events on one day are
                      otherwise indistinguishable, which reads as a duplicate. */}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
