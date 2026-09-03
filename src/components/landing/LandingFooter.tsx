import Link from "next/link";

import { Logo } from "@/shared/ui-components/layout/Logo";

import { FooterExploreLink } from "./FooterExploreLink";
import { FooterPostJobLink } from "./FooterPostJobLink";

interface FooterLink {
  readonly label: string;
  readonly href: string;
  /** Resolve the destination by auth (a signed-in company deep-links in-app). */
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
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Post a job", href: "/signup", roleAware: true },
      { label: "Become a recruiter", href: "/signup" },
      { label: "Log in", href: "/login" },
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
  const className = "text-sm text-white/60 transition-colors hover:text-white";
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
 * Site footer for every public page: a navy panel with the brand lockup and a
 * short pitch, three columns of links, and a legal bar. Full-bleed background
 * with a centered 1240px inner column so it reads the same on the narrow
 * marketing pages and the full-width tool pages.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 sm:px-5 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:px-10">
        <div className="max-w-xs">
          <Logo tone="onDark" />
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            You set the price. We connect you to the best — the recruiting
            marketplace where companies name their fee and top recruiters
            deliver.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
              {column.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {link.roleAware ? (
                    <FooterPostJobLink
                      label={link.label}
                      guestHref={link.href}
                    />
                  ) : link.recruiterOnly ? (
                    <FooterExploreLink label={link.label} href={link.href} />
                  ) : (
                    <FooterNavLink {...link} />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-10">
          <span>© {year} Head-Hunters.com. All rights reserved.</span>
          <span>A US-based recruiting marketplace.</span>
        </div>
      </div>
    </footer>
  );
}
