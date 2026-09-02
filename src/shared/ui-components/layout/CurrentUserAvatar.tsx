"use client";

import { UserRound } from "lucide-react";

import { useAuth } from "@/features/auth";
import { useMyCompanyProfile } from "@/features/companies/hooks/useCompanyProfile";
import { useMyRecruiterProfile } from "@/features/recruiters/hooks/useRecruiterProfile";
import { cn } from "@/shared/libs/shadCnConfig";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { RecruiterPhoto } from "@/shared/ui-components/data/RecruiterPhoto";

/**
 * The signed-in user's avatar, shown in the top bar, account menu and sidebar.
 * A recruiter's uploaded photo and a company's uploaded logo render here (each
 * falling back to a monogram); admins get initials. The role's own profile is
 * fetched only for that role, sharing the cached `myProfile` query the
 * dashboard/profile already load.
 *
 * `className` sets the size (e.g. `h-8 w-8 text-xs`); tailwind-merge lets it
 * override the default size classes.
 */
export function CurrentUserAvatar({ className }: { className?: string }) {
  const { user } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  const isCompany = user?.role === "company";
  const { data: recruiter } = useMyRecruiterProfile({ enabled: isRecruiter });
  const { data: company } = useMyCompanyProfile({ enabled: isCompany });

  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  if (isRecruiter) {
    return (
      <RecruiterPhoto
        recruiterProfileId={recruiter?.id ?? ""}
        hasPhoto={recruiter?.hasPhoto ?? false}
        name={name}
        size="sm"
        className={className}
      />
    );
  }

  if (isCompany) {
    return (
      <CompanyLogo
        companyProfileId={company?.id ?? ""}
        hasLogo={company?.hasLogo ?? false}
        name={company?.companyName || name}
        size="sm"
        // Round to a circle so a logo reads as an avatar in the chip.
        className={cn("rounded-full", className)}
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
