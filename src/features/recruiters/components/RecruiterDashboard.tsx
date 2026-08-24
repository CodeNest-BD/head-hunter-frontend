"use client";

import Link from "next/link";

import { useJobs } from "@/features/jobs";
import { useNotifications } from "@/features/notifications";
import { useRecruiterWallet } from "@/features/billing";
import { useInboxJobs } from "@/features/inbox";
import { PageBanner } from "@/shared/ui-components/brand";
import {
  AttentionRow,
  Panel,
  StatCard,
  type AttentionItem,
} from "@/shared/ui-components/dashboard/DashboardParts";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { useMyRecruiterProfile } from "../hooks/useRecruiterProfile";

export function RecruiterDashboard({ firstName }: { firstName: string }) {
  const profile = useMyRecruiterProfile();
  const inbox = useInboxJobs("recruiter", { limit: 50 });
  const wallet = useRecruiterWallet();
  const openRoles = useJobs({ limit: 5, sortBy: "publishedAt" });
  const activity = useNotifications({ limit: 6 });

  const references = profile.data?.references ?? [];
  const verificationStatus = profile.data?.verificationStatus;
  const yearsExperience = profile.data?.yearsExperience ?? null;

  const inboxJobs = inbox.data?.data ?? [];
  // One row per job you have someone on; the counts are already per job, so
  // the totals are a sum rather than a second query.
  const candidateCount = inboxJobs.reduce(
    (sum, job) => sum + job.candidateCount,
    0,
  );
  const awaitingReview = inboxJobs.reduce(
    (sum, job) => sum + job.newCandidateCount,
    0,
  );
  const unreadMessages = inboxJobs.reduce(
    (sum, job) => sum + job.unreadMessages,
    0,
  );

  const openRolesTotal = openRoles.data?.meta.total ?? null;
  const latestRole = openRoles.data?.data[0] ?? null;

  const candidatesHint =
    candidateCount === 0
      ? "nothing in flight"
      : awaitingReview > 0
        ? `${awaitingReview} awaiting review`
        : "all reviewed";

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
  if (unreadMessages > 0) {
    attention.push({
      id: "unread",
      tone: "amber",
      title: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
      detail: "A company is waiting on you in one of your conversations.",
      actionLabel: "Open",
      href: "/recruiter/inbox",
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
          label="Candidates in flight"
          value={inbox.isPending ? "—" : candidateCount}
          // The hint has to describe the same set as the number, so it counts
          // the same rows rather than a differently-scoped subset.
          hint={candidatesHint}
          href="/recruiter/inbox"
        />
        <StatCard
          label="In escrow"
          value={formatMinor(wallet.data?.inEscrowMinor ?? 0)}
          hint={
            wallet.data && wallet.data.placementsCount > 0
              ? `across ${wallet.data.placementsCount} placement${wallet.data.placementsCount === 1 ? "" : "s"}`
              : "released 30 days after a start"
          }
          href="/recruiter/wallet"
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
