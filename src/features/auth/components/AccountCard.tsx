"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { CardContent } from "@/shared/ui-components/controls/card";
import { Label } from "@/shared/ui-components/controls/label";
import { PasswordInput } from "@/shared/ui-components/controls/password-input";
import {
  SettingsActionRow,
  SettingsCard,
} from "@/shared/ui-components/layout/SettingsParts";
import { changePassword } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

// Mirrors the sign-up / reset rule so every screen agrees on what is valid.
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
type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-meta font-medium text-bad">{message}</p>;
}

/**
 * Sign-in details: the email as a readout — changing it needs re-verification
 * and has no endpoint — over the design's password row, where the form stays
 * folded away until it is asked for. Three password fields standing open on a
 * settings page read as work waiting to be done.
 */
export function AccountCard() {
  const { user } = useAuth();
  const [changing, setChanging] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!user) return null;

  const close = (): void => {
    reset();
    setChanging(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated", {
        description: "Use your new password next time you sign in.",
      });
      close();
    } catch (error) {
      // 401 means the current password was wrong — surface it on that field
      // rather than as a toast the form keeps no record of.
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
  });

  return (
    <SettingsCard
      title="Account"
      description="How you sign in. Your email can’t be changed here."
    >
      <CardContent className="flex flex-col gap-1.5 sm:max-w-sm">
        <Label htmlFor="account-email">Email</Label>
        <p
          id="account-email"
          className="m-0 flex h-10 items-center rounded-sm border border-line-strong bg-surface-sunken px-3 text-body text-ink-muted"
        >
          {user.email}
        </p>
      </CardContent>

      {changing ? (
        <form onSubmit={onSubmit}>
          <div className="grid gap-x-5 gap-y-4 border-t border-line-row px-6 pt-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2 sm:max-w-[calc(50%-0.625rem)]">
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
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line-row px-6 py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      ) : (
        <SettingsActionRow
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChanging(true)}
            >
              Change password
            </Button>
          }
        >
          Password · choose a new one at any time
        </SettingsActionRow>
      )}
    </SettingsCard>
  );
}
