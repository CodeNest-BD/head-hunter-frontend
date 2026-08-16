"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { useMessageUnreadCount } from "@/features/conversations";
import { useUnreadCount } from "@/features/notifications";
import { cn } from "@/shared/libs/shadCnConfig";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import { deriveBreadcrumbs } from "./breadcrumbs";
import { CountBadge } from "./CountBadge";
import { NAV_BY_ROLE, type NavItem } from "./dashboardNav";
import { Logo } from "./Logo";

/** Persists the desktop collapse choice across navigations and reloads. */
const SIDEBAR_COLLAPSED_KEY = "hh-sidebar-collapsed";

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
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
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
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge === "notifications" && <UnreadBadge />}
      {!collapsed && item.badge === "messages" && <UnreadMessagesBadge />}
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate: () => void;
  collapsed?: boolean;
}) {
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
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
            Menu
          </p>
        )}
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
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
        )}
        <button
          type="button"
          onClick={() => void logout()}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/15 hover:text-destructive",
            collapsed ? "justify-center px-0" : "mt-1 px-3",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && "Log out"}
        </button>
      </div>
    </div>
  );
}

export interface DashboardLayoutProps {
  children: ReactNode;
  /**
   * Content-column width. `false` (default) uses the standard `max-w-6xl`
   * reading width most pages use. `true` removes the cap entirely — for
   * data tables that need the full width. `"detail"` widens it to
   * `DETAIL_MAX_WIDTH_CLASSNAME` instead: enough for a page with two
   * columns of real content (e.g. the submission/inbox detail views) to use
   * the space beside the sidebar, without stretching edge-to-edge like
   * `true` does on an ultra-wide monitor.
   */
  wide?: boolean | "detail";
  /** Trail shown in the top bar, aligned with the content column. */
  breadcrumbs?: Crumb[];
}

/**
 * Cap for `wide="detail"` pages: most of the space beside the sidebar at a
 * 1920px viewport (1920 - 256px sidebar - 2 × 40px `lg:px-10` gutter =
 * 1584px available), while still leaving a proportionate margin on wider
 * displays instead of growing without bound.
 */
const DETAIL_MAX_WIDTH_CLASSNAME = "max-w-[96rem]";

/**
 * App chrome for authenticated pages: a left sidebar (role-based nav) and a
 * slim top bar. On desktop the sidebar collapses to an icon-only rail (the
 * choice is remembered); on small screens it is a slide-over toggled from the
 * top bar.
 */
export function DashboardLayout({
  children,
  wide = false,
  breadcrumbs,
}: DashboardLayoutProps) {
  const containerMaxWidthClassName =
    wide === true
      ? "max-w-none"
      : wide === "detail"
        ? DETAIL_MAX_WIDTH_CLASSNAME
        : "max-w-6xl";

  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  // Start expanded so the server HTML and first client render match (no
  // hydration mismatch); apply the stored choice on mount, then persist every
  // later change. The first pass only reads — it must not overwrite storage.
  const [collapsed, setCollapsed] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true") {
        setCollapsed(true);
      }
      return;
    }
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // Pages may pass a curated trail; otherwise derive one from the route so the
  // breadcrumb shows on every authenticated page, not just the ones that opt in.
  const pathname = usePathname();
  const resolvedCrumbs = breadcrumbs ?? deriveBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-secondary">
      {/* Top bar — breadcrumb (desktop) / logo (mobile), plus the menu toggle.
       * Its left inset tracks the sidebar width so the breadcrumb stays aligned
       * with the content column in both states. */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-secondary/80 px-4 backdrop-blur-md transition-[padding] duration-200 sm:px-6 lg:pr-10",
          collapsed ? "lg:pl-[6.5rem]" : "lg:pl-[18.5rem]",
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" aria-label="Head-Hunters home" className="lg:hidden">
          <Logo />
        </Link>
        {resolvedCrumbs.length > 0 && (
          <div className="hidden min-w-0 lg:block">
            <Breadcrumb items={resolvedCrumbs} />
          </div>
        )}
      </header>

      {/* Fixed sidebar (desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-0" : "justify-between px-4",
          )}
        >
          {!collapsed && (
            <Link href="/" aria-label="Head-Hunters home">
              <Logo />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        <SidebarContent onNavigate={close} collapsed={collapsed} />
      </aside>

      {/* Slide-over sidebar (mobile) — always full width, never collapsed. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
              <Link href="/" aria-label="Head-Hunters home" onClick={close}>
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

      {/* Content — left padding tracks the sidebar width. */}
      <div
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {/* pt-20 clears the fixed h-16 (4rem) top bar plus a 1rem gap — the
         * previous pt-24 doubled that gap (2rem) for no reason; see
         * `TwoColumnDetailLayout`'s `PAGE_HEIGHT_CLASSNAME` for the one
         * other place this padding's value has to be known. */}
        <main className="min-h-screen px-4 pb-16 pt-20 sm:px-6 lg:px-10">
          <div className={cn("mx-auto w-full", containerMaxWidthClassName)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
