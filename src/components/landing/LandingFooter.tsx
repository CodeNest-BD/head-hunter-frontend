import Link from "next/link";

import { Logo } from "@/shared/ui-components/layout/Logo";

import { FooterExploreLink } from "./FooterExploreLink";
import { FooterPostJobLink } from "./FooterPostJobLink";

interface FooterLink {
  readonly label: string;
  readonly href: string;
  /** Posting is employer-only — deep-link a company, hide from a recruiter. */
  readonly roleAware?: boolean;
  /** The live map is recruiter-only — hide this link from signed-in companies. */
  readonly recruiterOnly?: boolean;
}

interface FooterColumn {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

const COLUMNS: readonly FooterColumn[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Explore jobs", href: "/explore-jobs", recruiterOnly: true },
      { label: "How it Works", href: "/#how" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Post a Job", href: "/signup", roleAware: true },
      { label: "Become a Recruiter", href: "/signup" },
      { label: "Log In", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Support", href: "mailto:info@head-hunters.com" },
    ],
  },
];

/** Internal routes go through next/link; mailto/tel stay plain anchors. */
function FooterNavLink({ label, href }: FooterLink) {
  const className =
    "text-sub text-ink-muted transition-colors hover:text-blue-ink";
  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

/**
 * The reference's `.pubfoot`: a white surface above a hairline, carrying the
 * brand lockup and a short pitch, three columns of links, and a legal bar.
 * White rather than navy because the design system reserves navy for ink and
 * small accents — never a full-bleed surface. Full width with a centred
 * 1200px inner column (`.pubwrap`), so it reads the same on the narrow
 * marketing pages and the full-width tool pages.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-14 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-7 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sub leading-relaxed text-ink-muted">
            You set the price. We connect you to the best — the recruiting
            marketplace where companies name their fee and top recruiters
            deliver.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-label font-[650] uppercase text-ink-muted">
              {column.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) =>
                // The two role-aware links own their own <li> so the role they
                // are not for drops the item entirely, rather than leaving an
                // empty slot (and a stray gap). Plain links are wrapped here.
                link.recruiterOnly ? (
                  <FooterExploreLink
                    key={`${link.label}-${link.href}`}
                    label={link.label}
                    href={link.href}
                  />
                ) : link.roleAware ? (
                  <FooterPostJobLink
                    key={`${link.label}-${link.href}`}
                    label={link.label}
                    guestHref={link.href}
                  />
                ) : (
                  <li key={`${link.label}-${link.href}`}>
                    <FooterNavLink {...link} />
                  </li>
                ),
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-6 py-4 text-meta text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Head-Hunters.com. All rights reserved.</span>
          <span>A US-based recruiting marketplace.</span>
        </div>
      </div>
    </footer>
  );
}
