import type { Crumb } from "./Breadcrumb";

/**
 * Human labels for known path segments. Anything not listed is title-cased
 * from the slug, and id-looking segments (a job/candidate id) become
 * "Details" rather than showing a raw uuid in the trail.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  company: "Company",
  recruiter: "Recruiter",
  companies: "Companies",
  recruiters: "Recruiters",
  conversations: "Conversations",
  jobs: "Jobs",
  settings: "Settings",
  inbox: "Inbox",
  wallet: "Wallet",
  profile: "Profile",
  subscription: "Subscription",
  notifications: "Notifications",
  new: "New",
};

/**
 * Cumulative paths that are real pages, so an intermediate crumb pointing at
 * one can be a link. Paths absent here (e.g. the bare `/company` prefix, which
 * has no page) render as plain text instead of a broken link.
 */
const LINKABLE_PATHS = new Set<string>([
  "/dashboard",
  "/companies",
  "/jobs",
  "/notifications",
  "/company/jobs",
  "/company/inbox",
  "/company/wallet",
  "/company/profile",
  "/recruiter/inbox",
  "/recruiter/profile",
  "/admin/recruiters",
  "/admin/companies",
  "/admin/conversations",
  "/admin/jobs",
  "/admin/settings",
]);

function looksLikeId(segment: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) ||
    /^\d+$/.test(segment) ||
    segment.length >= 20
  );
}

function labelFor(segment: string): string {
  const known = SEGMENT_LABELS[segment];
  if (known) return known;
  if (looksLikeId(segment)) return "Details";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Builds a breadcrumb trail from the current pathname so every authenticated
 * page shows one without having to declare it. Always roots at Dashboard;
 * intermediate crumbs link only when they map to a real page.
 */
export function deriveBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: Crumb[] = [];
  if (segments[0] !== "dashboard") {
    crumbs.push({ label: "Dashboard", href: "/dashboard" });
  }

  let cumulative = "";
  segments.forEach((segment, index) => {
    cumulative += `/${segment}`;
    const isLast = index === segments.length - 1;
    const linkable = !isLast && LINKABLE_PATHS.has(cumulative);
    crumbs.push({
      label: labelFor(segment),
      href: linkable ? cumulative : undefined,
    });
  });

  return crumbs;
}
