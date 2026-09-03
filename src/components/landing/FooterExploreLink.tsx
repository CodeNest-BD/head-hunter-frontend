"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth";

const FOOTER_LINK_CLASS =
  "text-sm text-white/60 transition-colors hover:text-white";

/**
 * The footer's "Explore jobs" link. The live map is a recruiter surface, so a
 * signed-in company never sees the link — matching the route guard that also
 * blocks a company from reaching /explore-jobs directly by URL. Guests,
 * recruiters and admins see it as normal.
 */
export function FooterExploreLink({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const { status, user } = useAuth();
  if (status === "authenticated" && user?.role === "company") {
    return null;
  }
  return (
    <Link href={href} className={FOOTER_LINK_CLASS}>
      {label}
    </Link>
  );
}
