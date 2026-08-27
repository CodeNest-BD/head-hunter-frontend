"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Logo } from "@/shared/ui-components/layout/Logo";
import { UserMenu } from "@/shared/ui-components/layout/UserMenu";
import { NAV_BY_ROLE } from "@/shared/ui-components/layout/dashboardNav";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { href: "/#how", label: "How It Works" },
  { href: "/explore-jobs", label: "Explore Jobs" },
];

/**
 * Sticky white marketing nav copied from the v2 mock: brand lockup left,
 * anchor links center-right, and auth CTAs. Signed-in visitors see a single
 * "Go to dashboard" action instead of "Log in" / "Get started". Collapses to a
 * hamburger sheet on small screens.
 */
export function LandingNav({ fluid = false }: { fluid?: boolean }) {
  const [open, setOpen] = useState(false);
  const { status, user, logout } = useAuth();
  const isAuthed = status === "authenticated" && user !== null;
  // Until the silent boot refresh resolves we do not yet know whether the
  // visitor is signed in, so we must not render the signed-out CTAs — that is
  // what made a logged-in user briefly see "Log In / Sign Up" on the landing
  // page. Render a neutral placeholder during boot instead.
  const booting = status === "booting";
  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-brand-line bg-white/95 backdrop-blur">
        <nav
          aria-label="Primary"
          className={cn(
            "flex items-center gap-6 px-5 py-4 md:px-10",
            fluid ? "w-full" : "mx-auto max-w-[1240px]",
          )}
        >
          <Link href="/" aria-label="Head-Hunters home">
            <Logo />
          </Link>

          <div className="flex-1" />

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-brand-slate transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {booting ? (
              <span
                aria-hidden="true"
                className="h-9 w-24 animate-pulse rounded-md bg-brand-line"
              />
            ) : isAuthed ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#C9D0DF] font-semibold text-navy hover:border-primary hover:bg-transparent hover:text-primary"
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="font-bold">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#C9D0DF] text-navy md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
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
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 right-0 flex w-80 max-w-[85%] flex-col border-l border-brand-line bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-brand-line px-4 py-3.5">
              {isAuthed && user ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || (
                      <UserRound className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-navy">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="block truncate text-xs capitalize text-muted-foreground">
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
                className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-navy"
              >
                <X className="h-5 w-5" />
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
                        className="flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium text-brand-slate hover:bg-accent hover:text-primary"
                      >
                        <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* The two marketing links are a different kind of destination
               * from the account nav, so they read as their own labelled
               * group rather than as more menu items. */}
              <div
                className={cn(
                  "p-3",
                  isAuthed &&
                    navItems.length > 0 &&
                    "border-t border-brand-line",
                )}
              >
                <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-gray-light">
                  Explore
                </p>
                <div className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-2.5 py-2.5 text-sm font-semibold text-brand-slate hover:bg-accent hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-brand-line p-3">
              {booting ? (
                <span
                  aria-hidden="true"
                  className="h-9 animate-pulse rounded-md bg-brand-line"
                />
              ) : isAuthed ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Log out
                </button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-[#C9D0DF] font-semibold text-navy"
                  >
                    <Link href="/login" onClick={() => setOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button asChild className="w-full font-bold">
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
