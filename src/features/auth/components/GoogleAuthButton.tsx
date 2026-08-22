"use client";

import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import { HttpStatusCode } from "@/shared/libs/apiClient";
import { isApiError } from "@/shared/libs/errorHandler";
import { hasGoogleClientId } from "@/shared/components/Providers";
import { googleLogin } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import type { SignupRole } from "../types";

interface GoogleAuthButtonProps {
  // Signup passes the chosen role (+ optional name) so the backend can
  // provision a new google user. Login omits both (login-only) and handles the
  // 409 role_required by nudging the user to sign up.
  role?: SignupRole;
  name?: string;
}

/**
 * Google sign-in via @react-oauth/google. On success we hand the ID-token
 * credential to the backend, then establish the session through the shared
 * useAuth flow (fetch profile → commit → route to dashboard).
 *
 * Owns its own "or continue with" divider. The divider used to sit in each
 * form, which left it stranded above nothing whenever this component opted out
 * of rendering — keeping the two together means one condition governs both.
 */
export function GoogleAuthButton({ role, name }: GoogleAuthButtonProps) {
  const { establishSession } = useAuth();
  const [pending, setPending] = useState(false);

  // Without a real client id the underlying GoogleLogin only surfaces an opaque
  // error, so opt out of rendering entirely — password auth remains available.
  if (!hasGoogleClientId()) return null;

  const onSuccess = async (response: CredentialResponse): Promise<void> => {
    const credential = response.credential;
    if (!credential) {
      toast.error("Google sign-in failed", {
        description: "No credential was returned. Please try again.",
      });
      return;
    }
    setPending(true);
    try {
      const { accessToken } = await googleLogin({ credential, role, name });
      await establishSession(accessToken);
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === "role_required" ||
          error.statusCode === HttpStatusCode.Conflict)
      ) {
        toast.error("Choose an account type", {
          description:
            "Sign up first and pick Company or Recruiter to continue with Google.",
        });
        return;
      }
      toast.error("Google sign-in failed", {
        description: isApiError(error)
          ? error.message
          : "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          or continue with
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div
        className="flex justify-center"
        aria-busy={pending}
        style={pending ? { opacity: 0.6, pointerEvents: "none" } : undefined}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() =>
            toast.error("Google sign-in failed", {
              description: "Please try again.",
            })
          }
        />
      </div>
    </>
  );
}
