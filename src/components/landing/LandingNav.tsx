"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Menu, UserRound, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Logo } from "@/shared/ui-components/layout/Logo";
import { TopBarActions } from "@/shared/ui-components/layout/TopBarActions";
import { UserMenu } from "@/shared/ui-components/layout/UserMenu";
import { NAV_BY_ROLE } from "@/shared/ui-components/layout/dashboardNav";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";

interface NavItemLink {
  href: string;
  label: string;
  /** A same-page anchor (e.g. "/#how"), rendered as a plain <a>. */
  anchor?: boolean;
}

/**
 * Resources are the same for everyone. Raising a dispute is no longer its own
 * entry — it belongs to the support page, which is where /raise-a-dispute now
 * lands.
 */
const RESOURCES: readonly NavItemLink[] = [
  { href: "/faq", label: "Frequently Asked Questions" },
  { href: "/contact-support", label: "Contact Customer Support" },
];

/**
 * The sign-up dropdown's two audiences. Each carries the role in the query so
 * the form opens on the right questionnaire instead of asking again — see the
 * role seeding in `SignUpForm`. "Employers" is the client's word for `company`.
 */
const SIGNUP_AUDIENCES: readonly NavItemLink[] = [
  { href: "/signup?role=company", label: "Employers" },
  { href: "/signup?role=recruiter", label: "Recruiters" },
];

/**
 * The always-shown marketing links, before the audience/resources menus.
 *
 * No "Live Map" here: the map is a signed-in recruiter surface, not a public
 * marketing destination. Guests reach open roles through the hero's "Explore
 * Open Jobs" CTA instead.
 */
const PRIMARY_LINKS: readonly NavItemLink[] = [
  { href: "/about", label: "About" },
];

/** A link that respects the anchor flag (plain <a> for hashes, Link for routes). */
function NavItemAnchor({
  item,
  className,
  onClick,
}: {
  item: NavItemLink;
  className?: string;
  onClick?: () => void;
}) {
  return item.anchor ? (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  ) : (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

/** Desktop dropdown: a labelled trigger opening a small menu of links. */
function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: readonly NavItemLink[];
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-sm px-[11px] py-[7px] text-body font-[550] text-ink-body outline-none transition-colors hover:bg-surface-sub data-[state=open]:bg-tint data-[state=open]:text-blue"
        >
          {label}
          <ChevronDown className="size-3.5" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="start"
          sideOffset={12}
          className={`z-50 min-w-[210px] rounded-sm border border-line bg-surface p-1 shadow-pop ${MENU_OPTION_LIST}`}
        >
          {items.map((item) => (
            <Dropdown.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="block rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none transition-colors hover:bg-surface-sub focus:bg-surface-sub"
              >
                {item.label}
              </Link>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

/** A labelled group of links in the mobile sheet. */
function MobileGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: readonly NavItemLink[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="px-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-faint">
        {label}
      </p>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <NavItemAnchor
            key={item.href}
            item={item}
            onClick={onNavigate}
            className="rounded-sm px-2.5 py-2 text-sub font-[550] text-ink-body hover:bg-surface-sub hover:text-ink"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Sticky white marketing nav: brand lockup left, then the primary links and the
 * For Companies / For Recruiters / Resources menus, and the auth CTAs. Signed-in
 * visitors see the account menu instead of Log in / Sign up, and the audience
 * menu for the *other* role is hidden (a recruiter has no "For Companies"). The
 * "My Dashboard" links go to the dashboard when signed in, or to Log in for a
 * guest. Collapses to a hamburger sheet below `lg`.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const { status, user, logout } = useAuth();
  const isAuthed = status === "authenticated" && user !== null;
  // Until the silent boot refresh resolves we do not yet know whether the
  // visitor is signed in, so we must not render the signed-out CTAs — that is
  // what made a logged-in user briefly see "Log In / Sign Up" on the landing
  // page. Render a neutral placeholder during boot instead.
  const booting = status === "booting";
  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  // A recruiter has no "For Companies" menu, and a company has no "For
  // Recruiters"; a guest and an admin see both.
  const showForCompanies = user?.role !== "recruiter";
  const showForRecruiters = user?.role !== "company";
  // Guests are sent to sign in; signed-in users go straight to their dashboard.
  const dashboardHref = isAuthed ? "/dashboard" : "/login";
  const dashboardItems: readonly NavItemLink[] = [
    { href: dashboardHref, label: "My Dashboard" },
  ];

  const closeSheet = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        {/* `.pubnav` — the same height, edge padding and brand block as the app
            top bar, so the bar never shifts between page types. */}
        <nav
          aria-label="Primary"
          className="flex h-topbar w-full items-center gap-3 pl-4 pr-5"
        >
          <Link href="/" aria-label="Head-Hunters home">
            <Logo />
          </Link>

          <div className="flex-1" />

          <div className="hidden items-center gap-1 lg:flex">
            {PRIMARY_LINKS.map((item) => (
              <NavItemAnchor
                key={item.href}
                item={item}
                className="rounded-sm px-[11px] py-[7px] text-body font-[550] text-ink-body transition-colors hover:bg-surface-sub"
              />
            ))}
            {showForCompanies && (
              <NavDropdown label="For Companies" items={dashboardItems} />
            )}
            {showForRecruiters && (
              <NavDropdown label="For Recruiters" items={dashboardItems} />
            )}
            <NavDropdown label="Resources" items={RESOURCES} />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {booting ? (
              <span
                aria-hidden="true"
                className="h-9 w-24 animate-pulse rounded-sm bg-line"
              />
            ) : isAuthed && user ? (
              <>
                <TopBarActions role={user.role} />
                <UserMenu />
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Log In</Link>
                </Button>
                <Dropdown.Root>
                  <Dropdown.Trigger asChild>
                    <Button size="sm">
                      Sign Up
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Portal>
                    <Dropdown.Content
                      align="end"
                      sideOffset={8}
                      className={`z-50 min-w-[180px] rounded-sm border border-line bg-surface p-1 shadow-pop ${MENU_OPTION_LIST}`}
                    >
                      {SIGNUP_AUDIENCES.map((item) => (
                        <Dropdown.Item key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="block rounded-xs px-2.5 py-1.5 text-sub text-ink-body outline-none transition-colors hover:bg-surface-sub focus:bg-surface-sub"
                          >
                            {item.label}
                          </Link>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Content>
                  </Dropdown.Portal>
                </Dropdown.Root>
              </>
            )}
          </div>

          <button
            type="button"
            className="ml-auto inline-flex size-8.5 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-[17px]" />
          </button>
        </nav>
      </header>

      {/* Slide-over, not an in-flow panel: expanding the sticky header pushed
       * the page's hero down instead of covering it. It enters from the right,
       * where the trigger is.
       *
       * Deliberately a sibling of the header, not a child: the header's
       * `backdrop-blur` makes it a containing block for fixed descendants, so
       * nested here this would size itself to the header rather than the
       * viewport. */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 right-0 flex w-80 max-w-[85%] flex-col border-l border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              {isAuthed && user ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-meta font-bold text-blue">
                    {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || (
                      <UserRound className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-ink">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="block truncate text-[10.5px] capitalize text-ink-faint">
                      {user.role}
                    </span>
                  </span>
                </div>
              ) : (
                <Logo />
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-8.5 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink"
              >
                <X className="size-[17px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isAuthed && navItems.length > 0 && (
                <nav aria-label="Account" className="flex flex-col gap-1 p-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-sub font-[550] text-ink-muted hover:bg-surface-sub hover:text-ink"
                      >
                        <Icon className="size-[17px]" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              <div
                className={cn(
                  "flex flex-col gap-4 p-3",
                  isAuthed && navItems.length > 0 && "border-t border-line",
                )}
              >
                <MobileGroup
                  label="Menu"
                  items={PRIMARY_LINKS}
                  onNavigate={closeSheet}
                />
                {showForCompanies && (
                  <MobileGroup
                    label="For Companies"
                    items={dashboardItems}
                    onNavigate={closeSheet}
                  />
                )}
                {showForRecruiters && (
                  <MobileGroup
                    label="For Recruiters"
                    items={dashboardItems}
                    onNavigate={closeSheet}
                  />
                )}
                <MobileGroup
                  label="Resources"
                  items={RESOURCES}
                  onNavigate={closeSheet}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-line p-3">
              {booting ? (
                <span
                  aria-hidden="true"
                  className="h-9 animate-pulse rounded-sm bg-line"
                />
              ) : isAuthed ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-sub font-[550] text-bad hover:bg-bad-bg"
                >
                  <LogOut className="size-[17px]" />
                  Log out
                </button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  {SIGNUP_AUDIENCES.map((item) => (
                    <Button key={item.href} asChild className="w-full">
                      <Link href={item.href} onClick={() => setOpen(false)}>
                        Sign Up &mdash; {item.label}
                      </Link>
                    </Button>
                  ))}
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
