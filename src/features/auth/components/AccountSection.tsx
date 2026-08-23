"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { PasswordInput } from "@/shared/ui-components/controls/password-input";
import { changePassword } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

/** A read-only identity field — not editable in-app. */
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

// Mirrors the sign-up / reset password rule so every screen agrees on validity.
const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .max(72, "At most 72 characters")
      .regex(/^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\p{N}])/u, {
        message:
          "Include an uppercase letter, a lowercase letter, a number and a special character",
      }),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don’t match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  });
type FormData = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[13px] text-destructive">{message}</p>;
}

/**
 * Account identity: the email (read-only — changing it needs re-verification
 * and has no endpoint) plus an in-app password change (current + new +
 * confirm) that verifies the current password server-side.
 */
export function AccountSection() {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!user) return null;

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated", {
        description: "Use your new password next time you sign in.",
      });
      reset();
    } catch (error) {
      // 401 means the current password was wrong — surface it on that field.
      if (isApiError(error) && error.statusCode === 401) {
        setError("currentPassword", {
          message: "Current password is incorrect",
        });
        return;
      }
      toast.error("Could not change your password", {
        description: isApiError(error)
          ? error.message
          : "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-[minmax(0,15rem)_1fr]">
        <div>
          <h2 className="text-sm font-bold text-navy">Account</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Your sign-in details. Your email can&apos;t be changed here.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <ReadOnlyField label="Email" value={user.email} />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 border-t border-border pt-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                {...register("currentPassword")}
              />
              <FieldError message={errors.currentPassword?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              <FieldError message={errors.newPassword?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <FieldError message={errors.confirmPassword?.message} />
            </div>
            <div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
