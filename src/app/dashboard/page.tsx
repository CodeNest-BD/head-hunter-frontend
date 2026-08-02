"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Role } from "@/features/auth/types";
import { useUnreadCount } from "@/features/notifications/hooks/useNotifications";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";

interface DashboardLink {
  href: string;
  title: string;
  description: string;
}

const LINKS_BY_ROLE: Record<Role, DashboardLink[]> = {
  company: [
    {
      href: "/company/profile",
      title: "Company profile",
      description: "What recruiters see when they browse companies.",
    },
    {
      href: "/company/jobs",
      title: "Jobs",
      description: "Create a job, then publish it to notify your followers.",
    },
  ],
  recruiter: [
    {
      href: "/companies",
      title: "Companies",
      description:
        "Browse companies and follow the ones you want to hear from.",
    },
    {
      href: "/notifications",
      title: "Notifications",
      description: "New jobs from the companies you follow.",
    },
  ],
};

/** Recruiter-only: the count endpoint is not rendered for a company. */
function UnreadBadge() {
  const { data } = useUnreadCount();
  if (!data) return null;
  return (
    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
      {data}
    </span>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // AuthProvider gates this route: it renders nothing here until the session is
  // authenticated, so `user` is expected to be present. Guard anyway to keep
  // the type honest during the redirect frame.
  if (!user) return null;

  const links = LINKS_BY_ROLE[user.role];
  const isRecruiter = user.role === "recruiter";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email} ·{" "}
            <span className="capitalize">{user.role}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void logout();
          }}
        >
          Log out
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card className="transition hover:border-zinc-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {link.title}
                  {isRecruiter && link.href === "/notifications" && (
                    <UnreadBadge />
                  )}
                </CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {!user.emailVerified && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Your email is not verified yet. Some actions may be unavailable.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
