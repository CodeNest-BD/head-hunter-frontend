"use client";

import Link from "next/link";
import { Clock3, ShieldX } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import { useIsVerifiedRecruiter } from "../hooks/useIsVerifiedRecruiter";
import {
  useMyRecruiterProfile,
  useReapplyRecruiterVerification,
} from "../hooks/useRecruiterProfile";

/**
 * Tells an unverified recruiter where they stand: amber while the admin
 * review is pending, red (with the admin's note) after a rejection. Renders
 * nothing for verified recruiters and non-recruiters.
 */
export function VerificationBanner() {
  const { isRecruiter, isVerified, verificationStatus } =
    useIsVerifiedRecruiter();
  const { data: profile } = useMyRecruiterProfile();
  const reapply = useReapplyRecruiterVerification();

  if (!isRecruiter || isVerified || verificationStatus === null) {
    return null;
  }

  if (verificationStatus === "rejected") {
    return (
      <Alert tone="bad" icon={ShieldX}>
        <p className="font-[650]">Your verification was declined</p>
        {profile?.verificationNote && (
          <p className="mt-1">{profile.verificationNote}</p>
        )}
        <p className="mt-1">
          Update your{" "}
          <Link href="/recruiter/profile">profile and references</Link> and
          contact support to request a re-review.
        </p>
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reapply.mutate()}
            disabled={reapply.isPending}
          >
            {reapply.isPending ? "Re-applying…" : "Re-apply"}
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Alert tone="warn" icon={Clock3}>
      <p className="font-[650]">Verification pending</p>
      <p className="mt-1">
        An admin is reviewing your recruiting experience. The live job map and
        candidate submissions unlock as soon as you&apos;re approved — complete
        your <Link href="/recruiter/profile">profile and references</Link> to
        speed it up.
      </p>
    </Alert>
  );
}
