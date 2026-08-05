"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Logo } from "@/shared/ui-components/layout/Logo";
import { Button } from "@/shared/ui-components/controls/button";
import { cn } from "@/shared/libs/shadCnConfig";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { href: "#how", label: "How it works" },
  { href: "#escrow", label: "Escrow" },
  { href: "#pricing", label: "Pricing" },
];

/**
 * Sticky white marketing nav copied from the v2 mock: brand lockup left,
 * anchor links center-right, and auth CTAs. Signed-in visitors see a single
 * "Go to dashboard" action instead of "Log in" / "Get started". Collapses to a
 * hamburger sheet on small screens.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const { status } = useAuth();
  const isAuthed = status === "authenticated";

  return (
    <header className="sticky top-0 z-30 border-b border-[#E7EAF0] bg-white/95 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1240px] items-center gap-6 px-5 py-4 md:px-10"
      >
        <Link href="/" aria-label="HeadHunter home">
          <Logo />
        </Link>

        <div className="flex-1" />

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-[#3A4351] transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthed ? (
            <Button asChild className="font-bold">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="border-[#C9D2E3] font-semibold text-navy hover:border-primary hover:bg-transparent hover:text-primary"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="font-bold">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#C9D2E3] text-navy md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-[#E7EAF0] bg-white md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-[#3A4351] hover:bg-accent hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            {isAuthed ? (
              <Button asChild className="w-full font-bold">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#C9D2E3] font-semibold text-navy"
                >
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button asChild className="w-full font-bold">
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Get started
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
