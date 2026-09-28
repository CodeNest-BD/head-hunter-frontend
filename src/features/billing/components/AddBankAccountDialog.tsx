"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Lock, ShieldCheck, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuth } from "@/features/auth";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { NumericInput } from "@/shared/ui-components/controls/NumericInput";
import { StateSelect } from "@/shared/ui-components/controls/StateSelect";
import { Tile } from "@/shared/ui-components/list/Tile";
import {
  bankFormSchema,
  identityFormSchema,
  toBankPayload,
  toIdentityPayload,
  type BankFormValues,
  type IdentityFormValues,
} from "../bankAccountForm";
import {
  useSubmitPayoutBank,
  useSubmitPayoutIdentity,
} from "../hooks/useBilling";
import { type PayoutAccount } from "../schemas";
import { DIALOG_OVERLAY } from "@/shared/ui-components/feedback/dialogStyles";

function submitErrorMessage(error: unknown): string {
  if (isApiError(error)) return allMessages(error);
  return "Something went wrong. Please try again.";
}

const FIELD_ERROR = "text-meta font-medium text-bad";

/** The dialog's two steps; "identity" is skipped when already on file. */
type Step = "identity" | "bank";

interface AddBankAccountDialogProps {
  account: PayoutAccount;
  /** Fired after the bank lands, so the wallet can poll verification. */
  onBankSubmitted?: () => void;
  /** The element that opens the dialog. */
  children: ReactNode;
}

function StepBadge({
  index,
  label,
  state,
}: {
  index: number;
  label: string;
  state: "done" | "active" | "todo";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
          state === "active" && "bg-blue text-white",
          state === "done" && "bg-ok-bg text-ok",
          state === "todo" && "bg-neutral-bg text-neutral",
        )}
      >
        {state === "done" ? "✓" : index}
      </span>
      <span
        className={cn(
          "text-meta font-semibold",
          state === "active" ? "text-ink" : "text-ink-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function IdentityStep({
  defaults,
  pending,
  submitError,
  onSubmit,
}: {
  defaults: Partial<IdentityFormValues>;
  pending: boolean;
  submitError: unknown;
  onSubmit: (values: IdentityFormValues) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityFormValues>({
    resolver: zodResolver(identityFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dobMonth: "",
      dobDay: "",
      dobYear: "",
      ssnLast4: "",
      addressLine1: "",
      city: "",
      state: "",
      postalCode: "",
      tosAccepted: false,
      ...defaults,
    },
  });

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank-first-name">Legal first name</Label>
          <Input id="bank-first-name" {...register("firstName")} />
          {errors.firstName && (
            <p className={FIELD_ERROR}>{errors.firstName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank-last-name">Legal last name</Label>
          <Input id="bank-last-name" {...register("lastName")} />
          {errors.lastName && (
            <p className={FIELD_ERROR}>{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank-email">Email</Label>
          <Input id="bank-email" type="email" {...register("email")} />
          {errors.email && (
            <p className={FIELD_ERROR}>{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank-phone">Phone</Label>
          <Input
            id="bank-phone"
            type="tel"
            placeholder="+1 (614) 555-0177"
            {...register("phone")}
          />
          {errors.phone && (
            <p className={FIELD_ERROR}>{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-dob-month">Date of birth</Label>
        <div className="grid grid-cols-3 gap-2">
          <NumericInput
            id="bank-dob-month"
            placeholder="MM"
            maxLength={2}
            aria-label="Birth month"
            {...register("dobMonth")}
          />
          <NumericInput
            placeholder="DD"
            maxLength={2}
            aria-label="Birth day"
            {...register("dobDay")}
          />
          <NumericInput
            placeholder="YYYY"
            maxLength={4}
            aria-label="Birth year"
            {...register("dobYear")}
          />
        </div>
        {(errors.dobMonth ?? errors.dobDay ?? errors.dobYear) && (
          <p className={FIELD_ERROR}>
            {errors.dobYear?.message ??
              "Enter your date of birth as MM DD YYYY"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-ssn">Last 4 digits of SSN</Label>
        <NumericInput
          id="bank-ssn"
          placeholder="••••"
          maxLength={4}
          autoComplete="off"
          className="max-w-[120px] tracking-[0.3em]"
          {...register("ssnLast4")}
        />
        {errors.ssnLast4 ? (
          <p className={FIELD_ERROR}>{errors.ssnLast4.message}</p>
        ) : (
          <p className="text-meta text-ink-faint">
            Required by US banking regulations to verify your identity. Never
            stored on Head-Hunters.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-address">Home address</Label>
        <Input
          id="bank-address"
          placeholder="Street address"
          autoComplete="street-address"
          {...register("addressLine1")}
        />
        {errors.addressLine1 && (
          <p className={FIELD_ERROR}>{errors.addressLine1.message}</p>
        )}
        <div className="grid grid-cols-[1.4fr_1fr_0.9fr] gap-2">
          <div className="flex flex-col gap-1">
            <Input placeholder="City" aria-label="City" {...register("city")} />
            {errors.city && (
              <p className={FIELD_ERROR}>{errors.city.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <StateSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="State"
                />
              )}
            />
            {errors.state && (
              <p className={FIELD_ERROR}>{errors.state.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <NumericInput
              placeholder="ZIP"
              maxLength={5}
              aria-label="ZIP code"
              autoComplete="postal-code"
              {...register("postalCode")}
            />
            {errors.postalCode && (
              <p className={FIELD_ERROR}>{errors.postalCode.message}</p>
            )}
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-sub text-ink-body">
        <input
          type="checkbox"
          className="mt-0.5 size-[15px] accent-blue"
          {...register("tosAccepted")}
        />
        <span>
          I agree to payouts being processed by Stripe under the{" "}
          <a
            href="https://stripe.com/legal/connect-account"
            target="_blank"
            rel="noopener noreferrer"
            className="font-[550] text-blue-ink underline-offset-2 hover:underline"
          >
            Stripe Connected Account Agreement
          </a>
          .
        </span>
      </label>
      {errors.tosAccepted && (
        <p className={FIELD_ERROR}>{errors.tosAccepted.message}</p>
      )}

      {Boolean(submitError) && (
        <p className="text-sub font-medium text-bad">
          {submitErrorMessage(submitError)}
        </p>
      )}

      {/* The dialog's `.card__foot`: ruled off and bled to the panel edges,
          while staying inside the form so submit still belongs to it. */}
      <div className="-mx-4 -mb-4 mt-1 flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
        <Dialog.Close asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Dialog.Close>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}

function BankStep({
  defaults,
  pending,
  submitError,
  onSubmit,
}: {
  defaults: Partial<BankFormValues>;
  pending: boolean;
  submitError: unknown;
  onSubmit: (values: BankFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      accountHolderName: "",
      routingNumber: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ...defaults,
    },
  });

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-holder">Account holder name</Label>
        <Input id="bank-holder" {...register("accountHolderName")} />
        {errors.accountHolderName && (
          <p className={FIELD_ERROR}>{errors.accountHolderName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-routing">Routing number</Label>
        <NumericInput
          id="bank-routing"
          placeholder="110000000"
          maxLength={9}
          {...register("routingNumber")}
        />
        {errors.routingNumber ? (
          <p className={FIELD_ERROR}>{errors.routingNumber.message}</p>
        ) : (
          <p className="text-meta text-ink-faint">
            The 9-digit number on the bottom-left of a check.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank-account">Account number</Label>
          <NumericInput
            id="bank-account"
            maxLength={17}
            autoComplete="off"
            {...register("accountNumber")}
          />
          {errors.accountNumber && (
            <p className={FIELD_ERROR}>{errors.accountNumber.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank-account-confirm">Confirm account number</Label>
          <NumericInput
            id="bank-account-confirm"
            maxLength={17}
            autoComplete="off"
            {...register("confirmAccountNumber")}
          />
          {errors.confirmAccountNumber && (
            <p className={FIELD_ERROR}>{errors.confirmAccountNumber.message}</p>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-meta text-ink-muted">
        <Lock className="mt-px size-3.5 shrink-0" />
        Your bank details go directly to Stripe over an encrypted connection —
        Head-Hunters never stores them. Withdrawals arrive in 2–3 business days.
      </p>

      {Boolean(submitError) && (
        <p className="text-sub font-medium text-bad">
          {submitErrorMessage(submitError)}
        </p>
      )}

      {/* The dialog's `.card__foot`: ruled off and bled to the panel edges,
          while staying inside the form so submit still belongs to it. */}
      <div className="-mx-4 -mb-4 mt-1 flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
        <Dialog.Close asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Dialog.Close>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add bank account"}
        </Button>
      </div>
    </form>
  );
}

/**
 * In-app payout setup, Deel-style: two short steps in one dialog — who is
 * being paid (KYC), then where the money goes (bank) — no redirect to Stripe.
 * Details are forwarded to Stripe and never stored here; the identity step is
 * skipped entirely when it is already on file (e.g. updating the bank).
 */
export function AddBankAccountDialog({
  account,
  onBankSubmitted,
  children,
}: AddBankAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("identity");
  const { user } = useAuth();
  const identity = useSubmitPayoutIdentity();
  const bank = useSubmitPayoutBank();

  // The identity step is skipped when nothing identity-side is outstanding
  // AND the account is mid-onboarding (just submitted it) or verified (a pure
  // bank update). pending_verification and restricted keep the step visible:
  // the dialog is the only place a typoed SSN/DOB can be corrected before or
  // after Stripe fails verification on it.
  const skipIdentity =
    !account.needsIdentity &&
    (account.status === "verified" || account.status === "onboarding");

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setStep(skipIdentity ? "bank" : "identity");
      identity.reset();
      bank.reset();
    }
  };

  const identityDefaults: Partial<IdentityFormValues> = {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };

  const holderDefault = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const submitIdentity = (values: IdentityFormValues) => {
    identity.mutate(toIdentityPayload(values), {
      onSuccess: () => setStep("bank"),
    });
  };

  const submitBank = (values: BankFormValues) => {
    bank.mutate(toBankPayload(values), {
      onSuccess: (updated) => {
        setOpen(false);
        toast.success(
          updated.status === "verified"
            ? "Bank account added — you're ready to withdraw."
            : "Bank account added — verification usually takes a few minutes.",
        );
        onBankSubmitted?.();
      },
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY} />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-surface shadow-pop focus:outline-none">
          <div className="flex items-center justify-between gap-2.5 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Tile icon={Landmark} tone="blue" />
              <Dialog.Title className="text-card font-[650] text-ink">
                {skipIdentity ? "Update Bank Account" : "Set Up Payouts"}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X className="size-[15px]" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {!skipIdentity && (
              <div className="flex items-center gap-4">
                <StepBadge
                  index={1}
                  label="Your details"
                  state={step === "identity" ? "active" : "done"}
                />
                <span className="h-px flex-1 bg-line" />
                <StepBadge
                  index={2}
                  label="Bank account"
                  state={step === "bank" ? "active" : "todo"}
                />
              </div>
            )}

            <Dialog.Description className="flex items-start gap-2 text-sub text-ink-muted">
              <ShieldCheck className="mt-px size-[15px] shrink-0 text-blue" />
              {step === "identity"
                ? "A few details to verify who's getting paid — takes about a minute."
                : "Where should your commission go? Withdrawals land in this account."}
            </Dialog.Description>

            {step === "identity" ? (
              <IdentityStep
                defaults={identityDefaults}
                pending={identity.isPending}
                submitError={identity.isError ? identity.error : null}
                onSubmit={submitIdentity}
              />
            ) : (
              <BankStep
                defaults={{ accountHolderName: holderDefault }}
                pending={bank.isPending}
                submitError={bank.isError ? bank.error : null}
                onSubmit={submitBank}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
