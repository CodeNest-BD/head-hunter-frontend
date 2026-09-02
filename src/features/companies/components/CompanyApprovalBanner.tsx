"use client";

import Link from "next/link";
import { Clock3, ShieldX } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { useCompanyApprovalGate } from "../hooks/useCompanyApprovalGate";
import { useReapplyCompanyVerification } from "../hooks/useCompanyProfile";

/**
 * Tells an unapproved company where they stand: amber while the admin review is
 * pending, red (with the admin's note) after a decline. Renders nothing for an
 * approved company or any other role.
 *
 * The note is the whole point — it is what the admin wrote to this company, and
 * until now it only existed in the notification.
 */
export function CompanyApprovalBanner() {
  const { status, note } = useCompanyApprovalGate();
  const reapply = useReapplyCompanyVerification();

  if (status === undefined || status === "verified") {
    return null;
  }

  if (status === "rejected") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-md border border-destructive/40 bg-[#FBEAEA] p-4"
      >
        <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-[#9B3535]" />
        <div className="text-sm text-[#9B3535]">
          <p className="font-bold">Your company account was declined</p>
          {note && <p className="mt-1">{note}</p>}
          <p className="mt-1">
            Update your{" "}
            <Link
              href="/company/profile"
              className="font-semibold underline underline-offset-2"
            >
              company profile
            </Link>{" "}
            and re-apply, and an admin will take another look.
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
        <p className="font-bold">Approval pending</p>
        {note && <p className="mt-1">{note}</p>}
        <p className="mt-1">
          An Admin is reviewing your company profile. Posting jobs and reviewing
          candidates unlocks as soon as your account is approved – please be
          sure your{" "}
          <Link
            href="/company/profile"
            className="font-semibold underline underline-offset-2"
          >
            company profile
          </Link>{" "}
          is completed for faster approval (within 24 hours).
        </p>
      </div>
    </div>
  );
}
