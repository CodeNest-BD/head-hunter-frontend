"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";

import { useAuth } from "@/features/auth";
import { useAccountApproval } from "@/shared/hooks/useAccountApproval";
import { cn } from "@/shared/libs/shadCnConfig";
import { CurrentUserAvatar } from "./CurrentUserAvatar";
import { NavBadge } from "./NavBadge";
import { navForRole } from "./dashboardNav";
import { MENU_OPTION_LIST } from "@/shared/ui-components/controls/menuStyles";

/**
 * Signed-in identity control: an avatar + name that opens a dropdown of the
 * user's role-based navigation plus Log out. Used in the marketing nav in place
 * of the "Log in / Get started" CTAs.
 */
export function UserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const { isApproved } = useAccountApproval();
  if (!user) return null;

  const items = navForRole(user.role, isApproved);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2.5 rounded-sm py-1 pl-1 pr-1.5 text-[12.5px] font-semibold text-ink outline-none transition-colors hover:bg-surface-sub data-[state=open]:bg-surface-sub",
            className,
          )}
        >
          <CurrentUserAvatar className="size-8 text-meta" />
          <span className="max-w-[9rem] truncate">
            {user.firstName} {user.lastName}
          </span>
          <ChevronDown className="size-3 text-ink-faint" strokeWidth={2.4} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={`z-50 w-64 overflow-hidden rounded-sm border border-line bg-surface p-1 shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 ${MENU_OPTION_LIST}`}
        >
          {/* Identity header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <CurrentUserAvatar className="size-10 text-block" />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[10.5px] capitalize text-ink-muted">
                {user.role}
              </p>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item key={item.href} asChild>
                <Link
                  href={item.href}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-sub text-ink-body outline-none transition-colors focus:bg-surface-sub focus:text-ink data-[highlighted]:bg-surface-sub data-[highlighted]:text-ink"
                >
                  <Icon className="size-4 text-ink-muted" />
                  <span className="truncate">{item.label}</span>
                  <NavBadge badge={item.badge} />
                </Link>
              </DropdownMenu.Item>
            );
          })}

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item
            onSelect={() => void logout()}
            className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-sub text-ink-body outline-none transition-colors focus:bg-bad-bg focus:text-bad data-[highlighted]:bg-bad-bg data-[highlighted]:text-bad"
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
