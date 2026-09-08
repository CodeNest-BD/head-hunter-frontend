"use client";

import Link from "next/link";
import { useAuth, type Role } from "@/features/auth";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";

interface LandingCtaProps {
  /** The role this CTA is meant for (company vs recruiter action). */
  role: Role;
  /** Where a signed-in user of `role` should land (the deep link). */
  authedHref: string;
  /** Where signed-out visitors go. */
  guestHref?: string;
  /**
   * Tooltip shown when a signed-in visitor of the *other* role sees this CTA
   * disabled. Say who the action is for, not that it failed.
   */
  disabledTitle?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  children: React.ReactNode;
}

/**
 * A marketing CTA that deep-links signed-in users straight to the in-app action
 * instead of the signup funnel: a logged-in recruiter clicking "Start
 * recruiting" goes to their subscription, a logged-in company clicking "Post a
 * job" goes to the new-job form.
 *
 * A signed-in visitor of the *other* role gets it disabled rather than a live
 * link. `guestHref` is the signup funnel, and `AuthProvider` bounces an authed
 * visitor off every auth route to their own dashboard — so following it landed
 * a recruiter on the recruiter dashboard from a button labelled "Post a Job".
 */
export function LandingCta({
  role,
  authedHref,
  guestHref = "/signup",
  disabledTitle,
  variant,
  size,
  className,
  children,
}: LandingCtaProps) {
  const { status, user } = useAuth();
  const isAuthed = status === "authenticated" && user !== null;

  if (isAuthed && user.role !== role) {
    return (
      <Button
        disabled
        variant={variant}
        size={size}
        title={disabledTitle}
        className={cn("w-full cursor-not-allowed sm:w-auto", className)}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn("w-full sm:w-auto", className)}
    >
      <Link href={isAuthed ? authedHref : guestHref}>{children}</Link>
    </Button>
  );
}
