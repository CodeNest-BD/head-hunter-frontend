"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SIGNUP_ROLE_DETAILS, SIGNUP_ROLE_ORDER } from "./signUpRoles";
import type { SignupRole } from "../types";

interface SignUpRoleStepProps {
  onSelect: (role: SignupRole) => void;
}

/** First sign-up phase: pick an account type. Choosing a card advances
 * straight to the form, so there is no separate continue button to miss. */
export function SignUpRoleStep({ onSelect }: SignUpRoleStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us how you plan to use Head-Hunters.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SIGNUP_ROLE_ORDER.map((role) => {
          const { label, hint, blurb, icon: Icon } = SIGNUP_ROLE_DETAILS[role];
          return (
            <button
              key={role}
              type="button"
              onClick={() => onSelect(role)}
              className="group flex items-center gap-4 rounded-md border border-border bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-semibold text-foreground">
                  {label}
                  <span className="ml-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {hint}
                  </span>
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {blurb}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
              />
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
