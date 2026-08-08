"use client";

import Link from "next/link";
import { useAuth, type Role } from "@/features/auth";
import { Button } from "@/shared/ui-components/controls/button";

interface LandingCtaProps {
  /** The role this CTA is meant for (company vs recruiter action). */
  role: Role;
  /** Where a signed-in user of `role` should land (the deep link). */
  authedHref: string;
  /** Where everyone else goes — signed-out visitors and the other role. */
  guestHref?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A marketing CTA that deep-links signed-in users straight to the in-app action
 * instead of the signup funnel: a logged-in recruiter clicking "Start
 * recruiting" goes to their subscription, a logged-in company clicking "Post a
 * job" goes to the new-job form. Signed-out visitors (and the other role, for
 * whom the action doesn't apply) fall back to `guestHref`.
 */
export function LandingCta({
  role,
  authedHref,
  guestHref = "/signup",
  className,
  children,
}: LandingCtaProps) {
  const { status, user } = useAuth();
  const href =
    status === "authenticated" && user?.role === role ? authedHref : guestHref;

  return (
    <Button asChild className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
