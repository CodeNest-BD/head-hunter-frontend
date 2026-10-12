"use client";

import Link from "next/link";
import { Briefcase, Building2, MessageSquare, UserPlus } from "lucide-react";

import { useWallet } from "@/features/billing";

import { useMessageUnreadCount } from "@/features/conversations";

import { useJobs } from "@/features/jobs";

import { useNotifications } from "@/features/notifications";

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

import { formatDateTime } from "@/shared/utils/formatDate";

import { formatMinor } from "@/shared/utils/money";

import { useMyCompanyProfile } from "../hooks/useCompanyProfile";

/** A description shorter than this reads as a placeholder to recruiters. */
const MIN_DESCRIPTION = 40;

/**
 * The tinted glyph that leads an activity row. Matching on the event's type
 * keeps the tile meaningful as the backend adds types — an unrecognised event
 * still reads as a neutral notice rather than mislabelling itself.
 */
export function CompanyDashboard({ firstName }: { firstName: string }) {
  const profile = useMyCompanyProfile();
  const wallet = useWallet();
  const published = useJobs({ status: "published", limit: 100 });
  const inbox = useInboxJobs("company", { limit: 100 });
  const messages = useMessageUnreadCount();
  const activity = useNotifications({ limit: 6 });

  const companyName = profile.data?.companyName ?? "";
  const description = profile.data?.description ?? "";
  const descriptionLength = description.trim().length;

  const publishedTotal = published.data?.meta.total ?? 0;
  const noFeeCount = (published.data?.data ?? []).filter(
    (job) => job.recruiterFeeMinor === 0,
  ).length;

  const inboxJobs = inbox.data?.data ?? [];
  const newCandidates = inboxJobs.reduce(
    (sum, job) => sum + job.newCandidateCount,
    0,
  );
  const jobsWithNew = inboxJobs.filter(
    (job) => job.newCandidateCount > 0,
  ).length;
  const unreadMessages = messages.data ?? 0;

  const subtitleParts = [
    companyName || "Your company",
    `${publishedTotal} Published Job${publishedTotal === 1 ? "" : "s"}`,
    `${newCandidates} New Candidate${newCandidates === 1 ? "" : "s"}`,
  ];

  const attention: AttentionItem[] = [];
  if (newCandidates > 0) {
    attention.push({
      id: "waiting",
      icon: UserPlus,
      tone: "info",
      label: "Candidates waiting on your review",
      context: `Across ${jobsWithNew} job${jobsWithNew === 1 ? "" : "s"} in your inbox.`,
      priorityLabel: "Waiting",
      count: newCandidates,
      actionLabel: "Open inbox",
      href: "/company/inbox",
    });
  }
  if (noFeeCount > 0) {
    attention.push({
      id: "no-fee",
      icon: Briefcase,
      tone: "warn",
      label: "Published jobs with no recruiter fee",
      context: "Recruiters sort by fee, so these get seen last.",
      priorityLabel: "Action needed",
      count: noFeeCount,
      actionLabel: "Set fees",
      href: "/company/jobs",
    });
  }
  if (profile.data && descriptionLength < MIN_DESCRIPTION) {
    attention.push({
      id: "description",
      icon: Building2,
      tone: "warn",
      label: `Your company description is ${descriptionLength} character${descriptionLength === 1 ? "" : "s"}`,
      context: "It's the only thing recruiters read in the companies grid.",
      priorityLabel: "Incomplete",
      actionLabel: "Edit",
      href: "/company/profile",
    });
  }
  if (unreadMessages > 0) {
    attention.push({
      id: "messages",
      icon: MessageSquare,
      tone: "neutral",
      label: "Recruiter messages unanswered",
      context: "Open the conversation to reply.",
      priorityLabel: "Unanswered",
      count: unreadMessages,
      actionLabel: "Reply",
      href: "/company/inbox",
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

      {/* Ordered left-to-right as the employer's flow: post jobs → review
          candidates → the funds that back it all. */}
      <QuickViewBand
        label="Company summary"
        views={[
          {
            key: "published",
            label: "Published Jobs",
            value: published.isPending ? <StatValueSkeleton /> : publishedTotal,
            note:
              noFeeCount > 0
                ? `${noFeeCount} without a fee`
                : "Live on the job map",
            // A job with no fee ranks last for recruiters, so the tile says so
            // in the colour the rest of the app uses for "look at this".
            tone: noFeeCount > 0 ? "warn" : "ok",
            href: "/company/jobs",
          },
          {
            key: "new-candidates",
            label: "New Candidates",
            value: inbox.isPending ? <StatValueSkeleton /> : newCandidates,
            note:
              newCandidates === 0
                ? "Nothing waiting on you"
                : `Across ${jobsWithNew} job${jobsWithNew === 1 ? "" : "s"}`,
            tone: "info",
            href: "/company/inbox",
          },
          {
            key: "available",
            label: "Available Funds",
            value: wallet.isPending ? (
              <StatValueSkeleton />
            ) : (
              formatMinor(wallet.data?.availableMinor)
            ),
            note: "Free funds to post jobs",
            tone: "ok",
            href: "/company/wallet",
          },
          {
            key: "reserved",
            label: "Reserved Funds",
            value: wallet.isPending ? (
              <StatValueSkeleton />
            ) : (
              formatMinor(wallet.data?.reservedMinor)
            ),
            note: "Held for live jobs",
            tone: "neutral",
            href: "/company/wallet",
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
