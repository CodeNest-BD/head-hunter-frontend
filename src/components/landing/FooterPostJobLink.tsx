"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth";

const FOOTER_LINK_CLASS =
  "text-sm text-white/60 transition-colors hover:text-white";

/**
 * The footer's "Post a job" link, resolved by auth: a signed-in company goes
 * straight to the new-job form; everyone else (guests, recruiters, admins)
 * goes to the sign-up funnel.
 */
export function FooterPostJobLink({
  label,
  guestHref,
}: {
  label: string;
  guestHref: string;
}) {
  const { status, user } = useAuth();
  const href =
    status === "authenticated" && user?.role === "company"
      ? "/company/jobs/new"
      : guestHref;
  return (
    <Link href={href} className={FOOTER_LINK_CLASS}>
      {label}
    </Link>
  );
}
