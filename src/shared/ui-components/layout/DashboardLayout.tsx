"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { useUnreadRealtime } from "@/features/conversations";
import { useAccountApproval } from "@/shared/hooks/useAccountApproval";
import { cn } from "@/shared/libs/shadCnConfig";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { type Crumb } from "./Breadcrumb";
import { CurrentUserAvatar } from "./CurrentUserAvatar";
import { NavBadge } from "./NavBadge";
import { TopBarActions } from "./TopBarActions";
import { navForRole, type NavItem } from "./dashboardNav";
import { Logo } from "./Logo";

/** Persists the desktop collapse choice across navigations and reloads. */
const SIDEBAR_COLLAPSED_KEY = "hh-sidebar-collapsed";

/**
 * Top-bar account menu — the reference's `.userchip`: avatar, name over role,
 * and a caret, opening a popover with the full role navigation (Profile
 * included) plus Log out, a complete mirror of the rail. Below `xl` only the
 * avatar shows: the name and role are the bar's most expendable text, and the
 * popover repeats them the moment it opens.
 */
function UserMenu() {
  const { user, logout } = useAuth();
  const { isApproved } = useAccountApproval();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const items = navForRole(user.role, isApproved);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2.5 rounded-sm py-1 pl-1 pr-1.5 text-left transition-colors hover:bg-surface-sub"
        >
          <CurrentUserAvatar className="size-8 text-meta" />
          <span className="hidden min-w-0 flex-col leading-[1.15] xl:flex">
            <span className="truncate text-[12.5px] font-semibold text-ink">
              {user.firstName} {user.lastName}
            </span>
            <span className="truncate text-[10.5px] capitalize text-ink-muted">
              {user.role}
            </span>
          </span>
          <ChevronDown
            className="hidden size-3 shrink-0 text-ink-faint xl:block"
            strokeWidth={2.4}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-0">
        <div className="border-b border-line px-3 py-2.5">
          <p className="truncate text-[12.5px] font-semibold text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-[10.5px] capitalize text-ink-muted">
            {user.role}
          </p>
        </div>
        {/* The full role navigation, mirroring the rail. */}
        <div className={cn("p-1", MENU_OPTION_LIST)}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xs px-2.5 py-2 text-sub text-ink-body transition-colors hover:bg-surface-sub hover:text-ink"
              >
                <Icon className="size-4 text-ink-muted" />
                <span className="flex-1 truncate">{item.label}</span>
                <NavBadge badge={item.badge} />
              </Link>
            );
          })}
        </div>
        <div className="border-t border-line p-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-sub text-ink-body transition-colors hover:bg-bad-bg hover:text-bad"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The reference's `.rail__item`: a 36px row at 13px/550 on muted ink, turning
 * to a blue tint with a cobalt inset bar and a cobalt glyph when it is the
 * current page.
 */
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
        "flex h-9 items-center gap-2.5 rounded-sm text-sub font-[550] transition-colors",
        collapsed ? "justify-center px-0" : "px-2.5",
        active
          ? "bg-tint font-[650] text-blue-ink shadow-rail"
          : "text-ink-muted hover:bg-surface-sub hover:text-ink",
      )}
    >
      <Icon
        className={cn(
          "size-[17px] shrink-0",
          active ? "text-blue" : "opacity-90",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && <NavBadge badge={item.badge} />}
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

  return (
    <div className="flex h-full flex-col px-2.5 pb-2.5 pt-3.5">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-navy">
        {/* `.rail__section` — the section label, with the collapse toggle at its
         * right (rail only). When collapsed the label hides and the toggle
         * centres. The drawer heads its nav with the account block instead, so
         * it needs neither. */}
        <div
          className={cn(
            "flex items-center pb-1.5",
            collapsed ? "justify-center" : "justify-between px-2",
            isDrawer && "hidden",
          )}
        >
          {!collapsed && (
            <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-faint">
              Menu
            </p>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="rounded-xs p-1 text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-[17px]" />
              ) : (
                <PanelLeftClose className="size-[17px]" />
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
      </nav>

      {/* `.rail__foot` — identity on the left, log out as an icon button. */}
      <div className="mt-auto flex items-center gap-2.5 border-t border-line p-2.5">
        {/* The drawer carries the account block in its own header, so repeating
         * it here would show the same name twice. */}
        {!collapsed && !isDrawer && (
          <>
            <CurrentUserAvatar className="size-8 text-meta" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[10.5px] capitalize text-ink-faint">
                {user.role}
              </p>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          title="Log out"
          aria-label={collapsed || !isDrawer ? "Log out" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-sm text-sub font-[550] text-ink-muted transition-colors hover:bg-bad-bg hover:text-bad",
            collapsed || !isDrawer
              ? "size-8.5 shrink-0 justify-center"
              : "w-full px-2.5 py-2",
          )}
        >
          <LogOut className="size-[17px] shrink-0" />
          {!collapsed && isDrawer && "Log out"}
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
  /**
   * Drop the desktop left rail and let the content fill the width — for focused
   * pages (e.g. the recruiter job detail) that read better without the nav. The
   * top bar (and its mobile drawer) stay, so navigation is never lost.
   */
  hideSidebar?: boolean;
}

/**
 * The reference's app shell: a white 56px top bar over a white 232px rail, both
 * ruled off with hairlines, and a blue-grey canvas behind the content. Navy is
 * kept as ink and small accents — never a large surface.
 *
 * On desktop the rail collapses to an icon-only strip (the choice is
 * remembered); on small screens it is a slide-over toggled from the top bar.
 * Content is capped at 1560px and centred, so wide screens get balanced margins
 * instead of a dead right side.
 */
export function DashboardLayout({
  children,
  hideSidebar = false,
}: DashboardLayoutProps) {
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
    <div className="min-h-screen bg-canvas">
      {/* `.topbar` — brand on the left in a rail-width block so it lines up with
       * the nav beneath it; role actions, notifications and the account chip on
       * the right. */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-topbar items-center gap-3 border-b border-line bg-surface pl-4 pr-5">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-ml-1 flex size-8.5 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink lg:hidden"
        >
          <Menu className="size-[17px]" />
        </button>
        {/* `min-w-0` + the wordmark's own `truncate`: if the bar still runs out
         * of room the name ellipsises, rather than shunting the account avatar
         * off the end where it can't be tapped. */}
        <Link
          href="/"
          aria-label="Head-Hunters home"
          className="min-w-0 shrink lg:w-[216px] lg:shrink-0"
        >
          <Logo className="max-w-full [&>span]:truncate" />
        </Link>
        {/* `shrink-0` so the account avatar is never the thing squeezed off the
         * end of a narrow top bar. */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {user && <TopBarActions role={user.role} />}
          <UserMenu />
        </div>
      </header>

      {/* `.rail` — sits below the top bar on desktop (nav only; the account
       * controls live in the top-bar user menu). */}
      {!hideSidebar && (
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-topbar z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
            collapsed ? "w-topbar" : "w-rail",
          )}
        >
          <SidebarContent
            onNavigate={close}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((value) => !value)}
          />
        </aside>
      )}

      {/* Slide-over rail (mobile) — full nav plus the account block, since the
       * top-bar user menu is cramped on small screens. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col border-r border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              {user ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <CurrentUserAvatar className="size-8 text-meta" />
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
                <Link href="/" aria-label="Head-Hunters home" onClick={close}>
                  <Logo />
                </Link>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex size-8.5 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-sub hover:text-ink"
              >
                <X className="size-[17px]" />
              </button>
            </div>
            <SidebarContent onNavigate={close} variant="drawer" />
          </aside>
        </div>
      )}

      {/* `.page` — offset below the top bar and beside the rail. */}
      <div
        className={cn(
          "pt-topbar transition-[padding] duration-200",
          hideSidebar ? "" : collapsed ? "lg:pl-topbar" : "lg:pl-rail",
        )}
      >
        {/* Top bar (56px) is the only chrome above; see TwoColumnDetailLayout's
         * PAGE_HEIGHT_CLASSNAME, which also accounts for this main's pt-5/pb-14.
         * (The breadcrumb bar is hidden for now.) */}
        <main className="min-h-[calc(100vh-var(--topbar-h))] px-4 pb-14 pt-5 sm:px-6">
          {/* `.page__inner` — fluid to a 1560px cap, then centred. */}
          <div className="mx-auto w-full max-w-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
