"use client";

import { UserRound } from "lucide-react";

import { useAuth } from "@/features/auth";
import { useMyRecruiterProfile } from "@/features/recruiters/hooks/useRecruiterProfile";
import { cn } from "@/shared/libs/shadCnConfig";
import { RecruiterPhoto } from "@/shared/ui-components/data/RecruiterPhoto";

/**
 * The signed-in user's avatar, shown in the top bar, account menu and sidebar.
 * A recruiter's uploaded photo renders here (falling back to their initials);
 * every other role gets initials. Recruiters are the only role with a personal
 * photo, so the profile is fetched only for them — and it shares the cached
 * `recruiterKeys.myProfile` query the dashboard/profile already load.
 *
 * `className` sets the size (e.g. `h-8 w-8 text-xs`); tailwind-merge lets it
 * override RecruiterPhoto's default size classes.
 */
export function CurrentUserAvatar({ className }: { className?: string }) {
  const { user } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  const { data: profile } = useMyRecruiterProfile({ enabled: isRecruiter });

  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  if (isRecruiter) {
    return (
      <RecruiterPhoto
        recruiterProfileId={profile?.id ?? ""}
        hasPhoto={profile?.hasPhoto ?? false}
        name={name}
        size="sm"
        className={className}
      />
    );
  }

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .toUpperCase()
      .trim() || null;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-primary",
        className,
      )}
    >
      {initials ?? <UserRound className="h-4 w-4" />}
    </span>
  );
}
