import { z } from "zod";

/**
 * ABA routing checksum: 3·(d1+d4+d7) + 7·(d2+d5+d8) + (d3+d6+d9) ≡ 0 (mod 10).
 * Catches transposed/typoed routing numbers before they leave the form; the
 * backend re-validates with the same algorithm.
 */
export function isValidAbaRoutingNumber(routingNumber: string): boolean {
  if (!/^\d{9}$/.test(routingNumber)) return false;
  const d = [...routingNumber].map(Number);
  const sum =
    3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

/** A real calendar day (rejects Feb 30) at least 18 years in the past. */
function isAdultBirthDate(day: number, month: number, year: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDay =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDay) return false;
  return Date.UTC(year + 18, month - 1, day) <= Date.now();
}

/** Step 1 — who is being paid. Mirrors the backend's SubmitIdentityDto. */
export const identityFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    email: z.string().trim().email("Enter a valid email"),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number"),
    dobMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/, "MM"),
    dobDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, "DD"),
    dobYear: z.string().regex(/^(19|20)\d{2}$/, "YYYY"),
    ssnLast4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits"),
    addressLine1: z
      .string()
      .trim()
      .min(1, "Street address is required")
      .max(200),
    city: z.string().trim().min(1, "City is required").max(100),
    state: z.string().regex(/^[A-Za-z]{2}$/, "Select a state"),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
    tosAccepted: z.boolean().refine((accepted) => accepted, {
      message: "You must accept the payout terms to continue",
    }),
  })
  .superRefine((values, ctx) => {
    if (
      !isAdultBirthDate(
        Number(values.dobDay),
        Number(values.dobMonth),
        Number(values.dobYear),
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dobYear"],
        message: "Enter a valid date of birth (18 or older)",
      });
    }
  });
export type IdentityFormValues = z.infer<typeof identityFormSchema>;

/** Step 2 — where the money goes. Mirrors the backend's SubmitBankDto. */
export const bankFormSchema = z
  .object({
    accountHolderName: z
      .string()
      .trim()
      .min(1, "Account holder name is required")
      .max(100),
    routingNumber: z
      .string()
      .regex(/^\d{9}$/, "Routing numbers are 9 digits")
      .refine(isValidAbaRoutingNumber, {
        message: "That routing number isn't valid — check it and try again",
      }),
    accountNumber: z
      .string()
      .regex(/^\d{4,17}$/, "Enter a valid account number (4–17 digits)"),
    confirmAccountNumber: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.accountNumber !== values.confirmAccountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmAccountNumber"],
        message: "Account numbers don't match",
      });
    }
  });
export type BankFormValues = z.infer<typeof bankFormSchema>;

/** What POST /recruiter/payouts/account/identity expects. */
export interface SubmitIdentityInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dobDay: number;
  dobMonth: number;
  dobYear: number;
  ssnLast4: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  tosAccepted: boolean;
}

export const toIdentityPayload = (
  values: IdentityFormValues,
): SubmitIdentityInput => ({
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  email: values.email.trim(),
  phone: values.phone.trim(),
  dobDay: Number(values.dobDay),
  dobMonth: Number(values.dobMonth),
  dobYear: Number(values.dobYear),
  ssnLast4: values.ssnLast4,
  addressLine1: values.addressLine1.trim(),
  city: values.city.trim(),
  state: values.state.toUpperCase(),
  postalCode: values.postalCode,
  tosAccepted: values.tosAccepted,
});

/** What POST /recruiter/payouts/account/bank expects. */
export interface SubmitBankInput {
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
}

export const toBankPayload = (values: BankFormValues): SubmitBankInput => ({
  accountHolderName: values.accountHolderName.trim(),
  routingNumber: values.routingNumber,
  accountNumber: values.accountNumber,
});
