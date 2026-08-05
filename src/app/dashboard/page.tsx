"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Inbox,
  Map,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { useAuth, type Role } from "@/features/auth";
import { useUnreadCount } from "@/features/notifications";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";
import { cn } from "@/shared/libs/shadCnConfig";

interface DashboardLink {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const LINKS_BY_ROLE: Record<Role, DashboardLink[]> = {
  company: [
    {
      href: "/company/jobs",
      title: "Jobs",
      description: "Create a job, then publish it to notify your followers.",
      icon: Briefcase,
    },
    {
      href: "/company/inbox",
      title: "Inbox",
      description: "Candidates recruiters have submitted to your jobs.",
      icon: Inbox,
    },
    {
      href: "/company/profile",
      title: "Company profile",
      description: "What recruiters see when they browse companies.",
      icon: Building2,
    },
  ],
  recruiter: [
    {
      href: "/jobs",
      title: "Job map",
      description: "Open roles by state, and the fee each company is offering.",
      icon: Map,
    },
    {
      href: "/companies",
      title: "Companies",
      description:
        "Browse companies and follow the ones you want to hear from.",
      icon: Building2,
    },
    {
      href: "/notifications",
      title: "Notifications",
      description: "New jobs from the companies you follow.",
      icon: Bell,
    },
    {
      href: "/recruiter/profile",
      title: "My profile",
      description:
        "Your details, specializations, references and subscription.",
      icon: UserRound,
    },
  ],
  // No admin surface yet; an admin still gets a working dashboard rather than
  // a crash.
  admin: [],
};

/** Recruiter-only: the count endpoint is not rendered for a company. */
function UnreadBadge() {
  const { data } = useUnreadCount();
  if (!data) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
      {data > 99 ? "99+" : data}
    </span>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  // AuthProvider gates this route: it renders nothing here until the session is
  // authenticated, so `user` is expected to be present. Guard anyway to keep
  // the type honest during the redirect frame.
  if (!user) return null;

  const links = LINKS_BY_ROLE[user.role];
  const isRecruiter = user.role === "recruiter";

  return (
    <div className="flex flex-col gap-8">
      {/* Hero header with a soft brand glow. */}
      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-1.5">
          <p className="text-sm font-medium text-primary">
            Welcome back, {user.firstName}
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.firstName} {user.lastName} ({user.email}) ·{" "}
            <span className="capitalize">{user.role}</span>
          </p>
        </div>
      </header>

      {links.length === 0 && (
        <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
          There is no admin console yet.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => {
          const Icon = link.icon;
          const showBadge = isRecruiter && link.href === "/notifications";
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group relative flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {showBadge ? (
                  <UnreadBadge />
                ) : (
                  <ArrowRight className="h-[18px] w-[18px] text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
                  {link.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {!user.emailVerified && (
        <div
          className={cn(
            "rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200",
          )}
        >
          Your email is not verified yet. Some actions may be unavailable.
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
