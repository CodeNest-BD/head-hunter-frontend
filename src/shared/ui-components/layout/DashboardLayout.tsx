"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserRound, X } from "lucide-react";

import { useAuth } from "@/features/auth";
import { useMessageUnreadCount } from "@/features/conversations";
import { useUnreadCount } from "@/features/notifications";
import { cn } from "@/shared/libs/shadCnConfig";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import { CountBadge } from "./CountBadge";
import { NAV_BY_ROLE, type NavItem } from "./dashboardNav";
import { Logo } from "./Logo";

/** Recruiter-only unread pill; renders nothing for other roles or zero count. */
function UnreadBadge() {
  const { data } = useUnreadCount();
  return <CountBadge count={data} />;
}

/** Unread-messages pill for the Inbox (company) / Submissions (recruiter)
 * nav items; renders nothing with no unread messages. */
function UnreadMessagesBadge() {
  const { data } = useMessageUnreadCount();
  return <CountBadge count={data} />;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
        />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.badge === "notifications" && <UnreadBadge />}
      {item.badge === "messages" && <UnreadMessagesBadge />}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = NAV_BY_ROLE[user.role];
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
    .toUpperCase()
    .trim();

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-navy px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
          Menu
        </p>
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials || <UserRound className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/60">
              {user.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </div>
  );
}

/**
 * App chrome for authenticated pages: a fixed left sidebar (role-based nav) and
 * a slim top bar showing only the logo. The sidebar collapses to a slide-over
 * on small screens, toggled from the top bar.
 */
export function DashboardLayout({
  children,
  wide = false,
  breadcrumbs,
}: {
  children: ReactNode;
  /** Let content use the full width (data tables) instead of the reading-width
   * column most pages use. */
  wide?: boolean;
  /** Trail shown in the top bar, aligned with the content column. */
  breadcrumbs?: Crumb[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — logo only, plus the mobile menu toggle. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:pl-[18.5rem] lg:pr-10">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/temp" aria-label="HeadHunter home" className="lg:hidden">
          <Logo />
        </Link>
        {breadcrumbs && breadcrumbs.length > 0 && (
          // Aligned with the content column (sidebar 16rem + the content's
          // lg:px-10). Hidden on mobile, where the bar shows the logo instead.
          <div className="hidden min-w-0 lg:block">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
      </header>

      {/* Fixed sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link href="/temp" aria-label="HeadHunter home">
            <Logo />
          </Link>
        </div>
        <SidebarContent onNavigate={close} />
      </aside>

      {/* Slide-over sidebar (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
              <Link href="/temp" aria-label="HeadHunter home" onClick={close}>
                <Logo />
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={close} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 lg:px-10">
          <div
            className={cn("mx-auto w-full", wide ? "max-w-none" : "max-w-6xl")}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
