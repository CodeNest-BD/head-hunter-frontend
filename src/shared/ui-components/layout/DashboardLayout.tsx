"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ExternalLink,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/features/auth";
import {
  useRecruiterWallet,
  useWallet,
} from "@/features/billing/hooks/useBilling";
import {
  useMessageUnreadCount,
  useUnreadRealtime,
} from "@/features/conversations";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications";
import { notificationHref } from "@/features/notifications/utils/notificationHref";
import { useAccountApproval } from "@/shared/hooks/useAccountApproval";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { formatMinor } from "@/shared/utils/money";
import { type Crumb } from "./Breadcrumb";
import { InboxBadge } from "./InboxBadge";
import { navForRole, type NavItem } from "./dashboardNav";
import { Logo } from "./Logo";

/** Persists the desktop collapse choice across navigations and reloads. */
const SIDEBAR_COLLAPSED_KEY = "hh-sidebar-collapsed";

/**
 * Company top-bar actions: the available balance follows you across every page
 * (so you never publish into an empty wallet by surprise) next to Post a job.
 * The balance appears from `lg`, the width at which the top bar stops being
 * the drawer-plus-logo layout — below that the Wallet nav item carries it.
 */
function CompanyTopBarActions() {
  const { data } = useWallet();
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/company/wallet"
        className="hidden items-center gap-1.5 whitespace-nowrap rounded-md border border-input px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-brand-primary hover:text-primary lg:inline-flex"
      >
        <span className="text-muted-foreground">Available</span>
        <span className="tabular-nums">
          {formatMinor(data?.availableMinor)}
        </span>
      </Link>
      <Link
        href="/company/jobs/new"
        aria-label="Post a job"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Post a job</span>
      </Link>
    </div>
  );
}

/**
 * Recruiter top-bar figure: commission released so far this calendar year, the
 * recruiter's counterpart to the company's available balance. Links to the
 * wallet, where the same money is broken down by placement.
 */
function RecruiterTopBarActions() {
  // The wallet endpoint sits behind the approved-account gate, so a pending
  // recruiter must not fetch it — there is no commission to show yet either.
  const { isApproved } = useAccountApproval();
  const { data } = useRecruiterWallet(isApproved);
  if (!isApproved) return null;
  return (
    <Link
      href="/recruiter/wallet"
      title="Commission earned year to date"
      className="hidden items-center gap-1.5 whitespace-nowrap rounded-md border border-input px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-brand-primary hover:text-primary lg:inline-flex"
    >
      <span className="text-muted-foreground">Commission</span>
      <span className="tabular-nums">{formatMinor(data?.earnedYtdMinor)}</span>
    </Link>
  );
}

/**
 * Top-bar notifications: a bell with the unread count that opens a dropdown of
 * recent notifications, so they're read in place rather than on a dedicated
 * route. The list only fetches once the panel is opened.
 */
function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const count = typeof unread === "number" ? unread : 0;
  const list = useNotifications({ limit: 15 }, open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const items = list.data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : "Notifications"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[24rem] max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {count > 0
                ? `You have ${count} unread notification${count === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="shrink-0 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[24rem] overflow-y-auto">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const href = user ? notificationHref(item, user.role) : null;
                const isUnread = !item.readAt;
                const onSelect = () => {
                  if (isUnread) markRead.mutate(item.id);
                  setOpen(false);
                };
                const body = (
                  <div className="flex items-start gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm text-navy",
                          isUnread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(item.createdAt, {
                          addSuffix: true,
                        })}
                        {href && <ExternalLink className="h-3 w-3" />}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
                return (
                  <li key={item.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={onSelect}
                        className="block transition-colors hover:bg-accent"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={onSelect}
                        className="block w-full text-left transition-colors hover:bg-accent"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Top-bar account menu: avatar + name opening a popover with the full role
 * navigation (Profile included) plus Log out — a complete mirror of the
 * sidebar, so everything is reachable from either place. Below `xl` only the
 * avatar shows: the name and role are the bar's most expendable text, and the
 * popover repeats them the moment it opens.
 */
function UserMenu() {
  const { user, logout } = useAuth();
  const { isApproved } = useAccountApproval();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const items = navForRole(user.role, isApproved);
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
    .toUpperCase()
    .trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 shrink-0 items-center gap-2 rounded-md px-0.5 text-left transition-colors hover:bg-accent xl:pl-1 xl:pr-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials || <UserRound className="h-4 w-4" />}
          </span>
          <span className="hidden min-w-0 flex-col leading-tight xl:flex">
            <span className="truncate text-sm font-semibold text-navy">
              {user.firstName} {user.lastName}
            </span>
            <span className="truncate text-[11px] capitalize text-muted-foreground">
              {user.role}
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground xl:block" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <div className="border-b border-border px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-navy">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {user.role}
          </p>
        </div>
        {/* The full role navigation, mirroring the sidebar. */}
        <div className="p-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge === "inbox" && <InboxBadge />}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-border p-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
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
        "group relative flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
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
      {!collapsed && item.badge === "inbox" && <InboxBadge />}
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  collapsed = false,
  variant = "rail",
  onToggleCollapse,
}: {
  onNavigate: () => void;
  collapsed?: boolean;
  /**
   * "rail" is the desktop sidebar: collapsible, with the account block at its
   * foot. "drawer" is the mobile slide-over, which carries the account block
   * in its own header and adds the global site links — on desktop those live
   * in the top bar.
   */
  variant?: "rail" | "drawer";
  /** When set (rail only), renders the collapse toggle beside the MENU
   * label. Omitted on mobile, where the sidebar never collapses. */
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isApproved } = useAccountApproval();
  const isDrawer = variant === "drawer";
  if (!user) return null;

  const items = navForRole(user.role, isApproved);
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
        {/* MENU label with the collapse toggle at its right (rail only). When
         * collapsed the label hides and the toggle centres. The drawer heads
         * its nav with the account block instead, so it needs neither. */}
        <div
          className={cn(
            "flex items-center pb-2",
            collapsed ? "justify-center" : "justify-between px-3",
            isDrawer && "hidden",
          )}
        >
          {!collapsed && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
              Menu
            </p>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="rounded-md p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-[18px] w-[18px]" />
              ) : (
                <PanelLeftClose className="h-[18px] w-[18px]" />
              )}
            </button>
          )}
        </div>
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {/* The global site links are a different kind of destination from the
         * role nav, so they close the list as their own labelled group rather
         * than sitting above it unmarked. Drawer only — the top bar carries
         * them on desktop. */}
        {isDrawer && (
          <div className="mt-3 space-y-1 border-t border-sidebar-border pt-3">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
              Explore
            </p>
            <Link
              href="/explore-jobs"
              onClick={onNavigate}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              Live Map
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {/* The drawer carries the account block in its own header, so repeating
         * it here would show the same name twice. */}
        {!collapsed && !isDrawer && (
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
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
            "flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/15 hover:text-destructive",
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
   * Retained for API compatibility. Every authenticated page now fills the
   * content area edge-to-edge, so this no longer changes the width — pages
   * that want a narrower reading column cap it themselves.
   */
  wide?: boolean | "detail";
  /**
   * Retained for API compatibility. The breadcrumb bar is hidden for now, so
   * pages may still pass a trail but it isn't rendered.
   */
  breadcrumbs?: Crumb[];
}

/**
 * App chrome for authenticated pages: a left sidebar (role-based nav) and a
 * slim top bar. On desktop the sidebar collapses to an icon-only rail (the
 * choice is remembered); on small screens it is a slide-over toggled from the
 * top bar. The content area is full-width; pages own any narrower column.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  // Global unread-badge subscription. DashboardLayout is mounted by each
  // authenticated page itself (there is no shared app layout wrapping them),
  // so exactly one instance renders at a time — this is the one call site,
  // not a duplicate of the per-thread useConversationRealtime.
  useUnreadRealtime();

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

  return (
    <div className="min-h-screen bg-secondary">
      {/* Full-width top navbar: logo + global links on the left; role actions,
       * notifications and the account menu on the right. Spans the whole width,
       * with the sidebar sitting beneath it. */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-1.5 border-b border-border/70 bg-secondary/80 px-3 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-ml-1 shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* `min-w-0` + the wordmark's own `truncate`: if the bar still runs out
         * of room the name ellipsises, rather than shunting the account avatar
         * off the end where it can't be tapped. */}
        <Link
          href="/"
          aria-label="Head-Hunters home"
          className="min-w-0 shrink"
        >
          <Logo className="max-w-full [&>span]:truncate" />
        </Link>
        {/* Global site links, shown to every signed-in user on app pages
         * (public pages get the marketing nav). Tied to the same breakpoint as
         * the sidebar: while the hamburger is up, these live in the drawer's
         * Explore group, and duplicating them here is what crowded the tablet
         * bar into wrapping. */}
        <nav
          aria-label="Site"
          className="ml-4 hidden shrink-0 items-center gap-4 whitespace-nowrap lg:flex"
        >
          <Link
            href="/explore-jobs"
            className="text-sm font-semibold text-navy transition-colors hover:text-primary"
          >
            Live Map
          </Link>
        </nav>
        {/* `shrink-0` so the account avatar is never the thing squeezed off the
         * end of a narrow top bar. */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          {user?.role === "company" && <CompanyTopBarActions />}
          {user?.role === "recruiter" && <RecruiterTopBarActions />}
          {(user?.role === "company" || user?.role === "recruiter") && (
            <NotificationBell />
          )}
          <UserMenu />
        </div>
      </header>

      {/* Sidebar — sits below the navbar on desktop (nav only; the account
       * controls live in the top-bar user menu). */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent
          onNavigate={close}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      {/* Slide-over sidebar (mobile) — full nav plus the account block, since
       * the top-bar user menu is cramped on small screens. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-4 py-3.5">
              {user ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
                      .toUpperCase()
                      .trim() || <UserRound className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-sidebar-accent-foreground">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="block truncate text-xs capitalize text-sidebar-foreground/60">
                      {user.role}
                    </span>
                  </span>
                </div>
              ) : (
                <Link href="/" aria-label="Head-Hunters home" onClick={close}>
                  <Logo tone="onDark" />
                </Link>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="shrink-0 rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={close} variant="drawer" />
          </aside>
        </div>
      )}

      {/* Content — offset below the navbar and beside the sidebar. */}
      <div
        className={cn(
          "pt-16 transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {/* Navbar (4rem) is the only chrome above; see TwoColumnDetailLayout's
         * PAGE_HEIGHT_CLASSNAME, which also accounts for this main's pt-6/pb-16.
         * (The breadcrumb bar is hidden for now.) */}
        <main className="min-h-[calc(100vh-4rem)] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
