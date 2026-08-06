"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import { useAuth } from "@/features/auth";
import { useUnreadCount } from "@/features/notifications";
import { cn } from "@/shared/libs/shadCnConfig";
import { NAV_BY_ROLE } from "./dashboardNav";

/** Live unread count for the notifications menu item (recruiter only). */
function UnreadCount() {
  const { data } = useUnreadCount();
  if (!data) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
      {data > 99 ? "99+" : data}
    </span>
  );
}

/**
 * Signed-in identity control: an avatar + name that opens a dropdown of the
 * user's role-based navigation plus Log out. Used in the marketing nav in place
 * of the "Log in / Get started" CTAs.
 */
export function UserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .toUpperCase()
      .trim() || null;
  const items = NAV_BY_ROLE[user.role];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-[#C9D2E3] bg-white py-1 pl-1 pr-3 text-sm font-semibold text-navy outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-primary",
            className,
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
            {initials ?? <UserRound className="h-4 w-4" />}
          </span>
          <span className="max-w-[9rem] truncate">
            {user.firstName} {user.lastName}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-card-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">
              {initials ?? <UserRound className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {user.role}
              </p>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item key={item.href} asChild>
                <Link
                  href={item.href}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#3A4351] outline-none transition-colors focus:bg-accent focus:text-primary data-[highlighted]:bg-accent data-[highlighted]:text-primary"
                >
                  <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                  <span className="truncate">{item.label}</span>
                  {item.badge === "notifications" && <UnreadCount />}
                </Link>
              </DropdownMenu.Item>
            );
          })}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={() => void logout()}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors focus:bg-destructive/10 data-[highlighted]:bg-destructive/10"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
