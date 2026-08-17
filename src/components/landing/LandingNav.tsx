"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
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
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const { status, user, logout } = useAuth();
  const isAuthed = status === "authenticated" && user !== null;
  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  return (
    <header className="sticky top-0 z-30 border-b border-brand-line bg-white/95 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1240px] items-center gap-6 px-5 py-4 md:px-10"
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
          {isAuthed ? (
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
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#C9D0DF] text-navy md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-brand-line bg-white md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-brand-slate hover:bg-accent hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-1">
            {isAuthed ? (
              <>
                {user && (
                  <div className="mb-1 px-2 py-1.5">
                    <p className="truncate text-sm font-bold text-navy">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {user.role}
                    </p>
                  </div>
                )}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-brand-slate hover:bg-accent hover:text-primary"
                    >
                      <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="mt-1 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Log out
                </button>
              </>
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
        </div>
      </div>
    </header>
  );
}
