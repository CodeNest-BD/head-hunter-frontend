"use client";

import Link from "next/link";
import { Clock3, ShieldX } from "lucide-react";

import { useIsVerifiedRecruiter } from "../hooks/useIsVerifiedRecruiter";
import { useMyRecruiterProfile } from "../hooks/useRecruiterProfile";

/**
 * Tells an unverified recruiter where they stand: amber while the admin
 * review is pending, red (with the admin's note) after a rejection. Renders
 * nothing for verified recruiters and non-recruiters.
 */
export function VerificationBanner() {
  const { isRecruiter, isVerified, verificationStatus } =
    useIsVerifiedRecruiter();
  const { data: profile } = useMyRecruiterProfile();

  if (!isRecruiter || isVerified || verificationStatus === null) {
    return null;
  }

  if (verificationStatus === "rejected") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-md border border-destructive/40 bg-[#FBEAEA] p-4"
      >
        <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-[#9B3535]" />
        <div className="text-sm text-[#9B3535]">
          <p className="font-bold">Your verification was declined</p>
          {profile?.verificationNote && (
            <p className="mt-1">{profile.verificationNote}</p>
          )}
          <p className="mt-1">
            Update your{" "}
            <Link
              href="/recruiter/profile"
              className="font-semibold underline underline-offset-2"
            >
              profile and references
            </Link>{" "}
            and contact support to request a re-review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md border border-[#F0E2B8] bg-[#FBF3DF] p-4"
    >
      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#7A5109]" />
      <div className="text-sm text-[#7A5109]">
        <p className="font-bold">Verification pending</p>
        <p className="mt-1">
          An admin is reviewing your recruiting experience. The live job map and
          candidate submissions unlock as soon as you&apos;re approved —
          complete your{" "}
          <Link
            href="/recruiter/profile"
            className="font-semibold underline underline-offset-2"
          >
            profile and references
          </Link>{" "}
          to speed it up.
        </p>
      </div>
    </div>
  );
}
