"use client";

import { useWallet } from "@/features/billing";
import { useMessageUnreadCount } from "@/features/conversations";
import { useJobs } from "@/features/jobs";
import { useNotifications } from "@/features/notifications";
import { useInboxJobs } from "@/features/submissions";
import { PageBanner } from "@/shared/ui-components/brand";
import {
  AttentionRow,
  Panel,
  StatCard,
  type AttentionItem,
} from "@/shared/ui-components/dashboard/dashboard-parts";
import { formatDateTime } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { useMyCompanyProfile } from "../hooks/useCompanyProfile";

/** A description shorter than this reads as a placeholder to recruiters. */
const MIN_DESCRIPTION = 40;

export function CompanyDashboard({ firstName }: { firstName: string }) {
  const profile = useMyCompanyProfile();
  const wallet = useWallet();
  const published = useJobs({ status: "published", limit: 100 });
  const inbox = useInboxJobs({ limit: 100 });
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
  const newSubmissions = inboxJobs.reduce(
    (sum, job) => sum + job.newSubmissionCount,
    0,
  );
  const jobsWithNew = inboxJobs.filter(
    (job) => job.newSubmissionCount > 0,
  ).length;
  const unreadMessages = messages.data ?? 0;

  const subtitleParts = [
    companyName || "Your company",
    `${publishedTotal} published job${publishedTotal === 1 ? "" : "s"}`,
    `${newSubmissions} new submission${newSubmissions === 1 ? "" : "s"}`,
  ];

  const attention: AttentionItem[] = [];
  if (newSubmissions > 0) {
    attention.push({
      id: "waiting",
      tone: "blue",
      title: `${newSubmissions} candidate${newSubmissions === 1 ? "" : "s"} waiting on your review`,
      detail: `Across ${jobsWithNew} job${jobsWithNew === 1 ? "" : "s"} in your inbox.`,
      actionLabel: "Open inbox",
      href: "/company/inbox",
    });
  }
  if (noFeeCount > 0) {
    attention.push({
      id: "no-fee",
      tone: "amber",
      title: `${noFeeCount} published job${noFeeCount === 1 ? "" : "s"} have no recruiter fee`,
      detail: "Recruiters sort by fee, so these get seen last.",
      actionLabel: "Set fees",
      href: "/company/jobs",
    });
  }
  if (profile.data && descriptionLength < MIN_DESCRIPTION) {
    attention.push({
      id: "description",
      tone: "amber",
      title: `Your company description is ${descriptionLength} character${descriptionLength === 1 ? "" : "s"}`,
      detail: "It's the only thing recruiters read in the companies grid.",
      actionLabel: "Edit",
      href: "/company/profile",
    });
  }
  if (unreadMessages > 0) {
    attention.push({
      id: "messages",
      tone: "muted",
      title: `${unreadMessages} recruiter message${unreadMessages === 1 ? "" : "s"} unanswered`,
      detail: "Open the conversation to reply.",
      actionLabel: "Reply",
      href: "/company/inbox",
    });
  }

  const recentActivity = activity.data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        size="lg"
        eyebrow="Overview"
        title={`Hey ${firstName}`}
        subtitle={subtitleParts.join(" · ")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="navy"
          label="Available to spend"
          value={formatMinor(wallet.data?.availableMinor)}
          hint="before fees are reserved"
        />
        <StatCard
          label="New submissions"
          value={inbox.isPending ? "—" : newSubmissions}
          hint={`across ${jobsWithNew} job${jobsWithNew === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Published jobs"
          value={published.isPending ? "—" : publishedTotal}
          hint={
            noFeeCount > 0 ? `${noFeeCount} without a fee` : "all have a fee"
          }
        />
        <StatCard
          label="Reserved"
          value={formatMinor(wallet.data?.reservedMinor)}
          hint="held against live posts"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Needs your attention">
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
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
