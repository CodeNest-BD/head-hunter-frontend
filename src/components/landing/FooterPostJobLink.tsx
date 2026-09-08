"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth";

const FOOTER_LINK_CLASS =
  "text-sm text-white/60 transition-colors hover:text-white";

/**
 * The footer's "Post a Job" list item. Posting is an employer action, so a
 * signed-in recruiter never sees it — following it only bounced them off
 * /signup into their own dashboard, from a link labelled "Post a Job".
 * A signed-in company goes straight to the new-job form; guests and admins get
 * the sign-up funnel. Renders its own `<li>`, like FooterExploreLink, so a
 * recruiter drops the item rather than leaving an empty list slot.
 */
export function FooterPostJobLink({
  label,
  guestHref,
}: {
  label: string;
  guestHref: string;
}) {
  const { status, user } = useAuth();
  const isAuthed = status === "authenticated" && user !== null;
  if (isAuthed && user.role === "recruiter") {
    return null;
  }
  return (
    <li>
      <Link
        href={
          isAuthed && user.role === "company" ? "/company/jobs/new" : guestHref
        }
        className={FOOTER_LINK_CLASS}
      >
        {label}
      </Link>
    </li>
  );
}
