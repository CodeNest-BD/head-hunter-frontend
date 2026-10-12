"use client";

import Link from "next/link";
import { BadgeCheck, Briefcase, MessageSquare, Users } from "lucide-react";

import { useJobs } from "@/features/jobs";

import { useNotifications } from "@/features/notifications";

import { useRecruiterWallet } from "@/features/billing";

import { useInboxJobs } from "@/features/inbox";

import { PageHeader } from "@/shared/ui-components/brand";

import {
  ActivityFeed,
  AttentionTable,
  PanelGroup,
  QuickViewBand,
  Section,
  SectionHead,
  StatValueSkeleton,
  type ActivityItem,
  type AttentionItem,
} from "@/shared/ui-components/dashboard/DashboardParts";

import { activityGlyph } from "@/features/notifications/utils/activityGlyph";

import { jobPath } from "@/shared/utils/entityPaths";

import { formatDateTime } from "@/shared/utils/formatDate";

import { formatMinor } from "@/shared/utils/money";

import { useMyRecruiterProfile } from "../hooks/useRecruiterProfile";

/**
 * The tinted glyph that leads an activity row. Matching on the event's type
 * keeps the tile meaningful as the backend adds types — an unrecognised event
 * still reads as a neutral notice rather than mislabelling itself.
 */
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
  const unreadMessages = inboxJobs.reduce(
    (sum, job) => sum + job.unreadMessages,
    0,
  );

  const latestRole = openRoles.data?.data[0] ?? null;
  // Every role the marketplace would show this recruiter, not the fetched
  // page's length — the query only pulls five rows for the attention feed.
  const openRolesCount = openRoles.data?.meta.total ?? null;

  const subtitleParts = [
    "Recruiter",
    verificationStatus === "verified"
      ? "Verified"
      : verificationStatus === "rejected"
        ? "Verification declined"
        : "Pending verification",
    yearsExperience !== null
      ? `${yearsExperience} Year${yearsExperience === 1 ? "" : "s"} Experience`
      : null,
  ].filter(Boolean);

  // The attention feed is derived from real signals, ordered most-actionable
  // first, and capped so the card stays a glance, not a backlog.
  const attention: AttentionItem[] = [];
  if (verificationStatus && verificationStatus !== "verified") {
    attention.push({
      id: "verification",
      icon: BadgeCheck,
      tone: "warn",
      label:
        verificationStatus === "rejected"
          ? "Your verification was declined"
          : "Your account is pending verification",
      context:
        "Complete your profile and references, then an admin reviews your access.",
      priorityLabel: "Action needed",
      actionLabel: "Review",
      href: "/recruiter/profile",
    });
  }
  if (latestRole) {
    attention.push({
      id: `role-${latestRole.id}`,
      icon: Briefcase,
      tone: "info",
      label: `${latestRole.title || "A new role"} just posted`,
      context: `${latestRole.companyName || "A company"} · ${formatMinor(
        latestRole.recruiterFeeMinor,
      )} recruiter fee`,
      priorityLabel: "New",
      actionLabel: "Submit",
      href: jobPath(latestRole),
    });
  }
  if (unreadMessages > 0) {
    attention.push({
      id: "unread",
      icon: MessageSquare,
      tone: "warn",
      label: "Unread messages",
      context: "A company is waiting on you in one of your conversations.",
      priorityLabel: "Waiting",
      count: unreadMessages,
      actionLabel: "Open",
      href: "/recruiter/inbox",
    });
  }
  if (references.length < 3) {
    const missing = 3 - references.length;
    attention.push({
      id: "references",
      icon: Users,
      tone: "info",
      label: `References still needed`,
      context: "Admins check references when they review your account.",
      priorityLabel: "Incomplete",
      count: missing,
      actionLabel: "Add",
      href: "/recruiter/profile",
    });
  }

  // The feed's own shape, built once: the glyph helper already decides a
  // notification's tone, and the dashboard only has to carry it across.
  const activityItems: ActivityItem[] = (activity.data?.data ?? []).map(
    (note) => ({
      id: note.id,
      tone: activityGlyph(note.type).tone,
      title: note.title,
      detail: note.body ?? undefined,
      at: note.createdAt,
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${firstName}'s Dashboard`}
        subtitle={subtitleParts.join(" · ")}
      />

      <QuickViewBand
        label="Recruiter summary"
        views={[
          {
            key: "open-roles",
            label: "Open Roles",
            value: openRoles.isPending ? (
              <StatValueSkeleton />
            ) : (
              (openRolesCount ?? "—")
            ),
            note: "Open to you right now",
            tone: "info",
            href: "/explore-jobs",
          },
          {
            key: "in-process",
            label: "Candidates In Process",
            value: inbox.isPending ? <StatValueSkeleton /> : candidateCount,
            note: "Submitted, interviewing, pending feedback",
            tone: "info",
            href: "/recruiter/inbox",
          },
          {
            key: "pending",
            label: "Pending Commission",
            value: wallet.isPending ? (
              <StatValueSkeleton />
            ) : (
              formatMinor(wallet.data?.inEscrowMinor ?? 0)
            ),
            note: "Released 30 days after a start",
            tone: "warn",
            href: "/recruiter/wallet",
          },
          {
            key: "ytd",
            label: "Commissions YTD",
            value: wallet.isPending ? (
              <StatValueSkeleton />
            ) : (
              formatMinor(wallet.data?.earnedYtdMinor ?? 0)
            ),
            note: "What you’ve earned this year",
            tone: "ok",
            href: "/recruiter/wallet",
          },
        ]}
      />

      <PanelGroup
        gridClassName="lg:grid-cols-2"
        panels={[
          {
            id: "attention",
            label: "Needs your attention",
            content: (
              <Section label="Needs your attention">
                <SectionHead
                  title="Needs your attention"
                  action={
                    <Link
                      href="/notifications"
                      className="text-[12.5px] font-[550] text-blue-ink transition-colors hover:text-blue-deep"
                    >
                      View all
                    </Link>
                  }
                />
                <AttentionTable
                  items={attention.slice(0, 5)}
                  emptyMessage="You're all caught up — nothing needs your attention right now."
                />
              </Section>
            ),
          },
          {
            id: "activity",
            label: "Recent activity",
            content: (
              <Section label="Recent activity">
                <SectionHead title="Recent activity" className="pb-3" />
                <ActivityFeed
                  items={activityItems}
                  emptyMessage="No recent activity yet."
                  formatAt={formatDateTime}
                />
              </Section>
            ),
          },
        ]}
      />
    </div>
  );
}
