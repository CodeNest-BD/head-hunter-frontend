import { z } from "zod";

import { phoneSchema } from "@/shared/libs/phone";
import {
  addressLineSchema,
  citySchema,
  stateSchema,
  zipSchema,
} from "@/shared/libs/usAddress";

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

/**
 * Normalizes what people actually type — "(614) 555-0177", "614 555 0177" —
 * to the E.164 wire shape the backend's PHONE_PATTERN requires, assuming US
 * for bare 10-digit numbers (this form collects a US payout identity), then
 * validates it as a real number via the shared schema.
 */
const usPhoneInputSchema = z
  .string()
  .trim()
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    return value.startsWith("+")
      ? `+${digits}`
      : `+${digits.length === 10 ? `1${digits}` : digits}`;
  })
  .pipe(phoneSchema);

/** Step 1 — who is being paid. Mirrors the backend's SubmitIdentityDto. */
export const identityFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z.string().trim().email("Enter a valid email"),
    phone: usPhoneInputSchema,
    dobMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/, "MM"),
    dobDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, "DD"),
    dobYear: z.string().regex(/^(19|20)\d{2}$/, "YYYY"),
    ssnLast4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits"),
    addressLine1: addressLineSchema,
    city: citySchema,
    state: stateSchema,
    postalCode: zipSchema,
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
