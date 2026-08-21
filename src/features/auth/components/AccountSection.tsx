"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { forgotPassword } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

/** A read-only identity field (email / username — not editable in-app). */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-navy">{label}</span>
      <p className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

/**
 * Account identity: email and username (read-only — changing them needs
 * re-verification and has no endpoint), plus a password change that reuses the
 * existing reset-by-email flow, since there is no logged-in change-password
 * endpoint.
 */
export function AccountSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  if (!user) return null;

  const changePassword = async () => {
    setSending(true);
    try {
      await forgotPassword(user.email);
      toast("Check your email", {
        description: "We sent a code to reset your password.",
      });
      router.push(`/reset-password?email=${encodeURIComponent(user.email)}`);
    } catch {
      toast.error("Could not start the password reset. Please try again.");
      setSending(false);
    }
  };

  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-[minmax(0,15rem)_1fr]">
        <div>
          <h2 className="text-sm font-bold text-navy">Account</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Your sign-in details. Email and username can&apos;t be changed here.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Email" value={user.email} />
            <ReadOnlyField label="Username" value={user.username} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy">Password</span>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sending}
                onClick={() => void changePassword()}
              >
                <KeyRound className="h-4 w-4" />
                {sending ? "Sending…" : "Change password"}
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground">
              We&apos;ll email a code, then take you to set a new password.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
