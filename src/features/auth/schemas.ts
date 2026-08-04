import { z } from "zod";
import { signupRoleSchema, type SignupRole } from "./types";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignInFormData = z.infer<typeof signInSchema>;

/** Mirrors the backend recruiter_specialization enum. */
export const RECRUITER_SPECIALIZATIONS = [
  "accounting",
  "finance",
  "human_resources",
  "technology",
  "pharma",
  "skilled_trades",
  "medical",
] as const;
export const recruiterSpecializationSchema = z.enum(RECRUITER_SPECIALIZATIONS);
export type RecruiterSpecialization = z.infer<
  typeof recruiterSpecializationSchema
>;

/** Human labels; the API speaks snake_case enums. */
export const RECRUITER_SPECIALIZATION_LABELS: Record<
  RecruiterSpecialization,
  string
> = {
  accounting: "Accounting",
  finance: "Finance",
  human_resources: "Human resources",
  technology: "Technology",
  pharma: "Pharma",
  skilled_trades: "Skilled trades",
  medical: "Medical",
};

export const MAX_SIGNUP_REFERENCES = 3;

const signUpReferenceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Reference name is required")
    .max(120, "Keep it under 120 characters"),
  company: z.string().trim().max(120, "Keep it under 120 characters"),
  title: z.string().trim().max(120, "Keep it under 120 characters"),
  phone: z.string().trim().max(32, "Keep it under 32 characters"),
});
export type SignUpReferenceValues = z.infer<typeof signUpReferenceSchema>;

/**
 * Sign-up form. Mirrors the backend SignUpDto: optional text fields stay
 * strings where "" means unset (converted at submit by `toSignUpPayload`).
 * Role-conditional presence the object schema can't express — a company must
 * name itself — lives in the superRefine, matching the backend service check.
 */
export const signUpSchema = z
  .object({
    role: signupRoleSchema,
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(80, "Keep it under 80 characters"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(80, "Keep it under 80 characters"),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(/^[A-Za-z0-9_]+$/, "Use only letters, digits and underscores"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    phone: z.string().trim().max(32, "Keep it under 32 characters"),
    companyName: z.string().trim().max(160, "Keep it under 160 characters"),
    yearsExperience: z
      .string()
      .trim()
      .refine((value) => value === "" || /^(\d|[1-7]\d|80)$/.test(value), {
        message: "Enter a number of years between 0 and 80",
      }),
    specializations: z.array(recruiterSpecializationSchema),
    references: z
      .array(signUpReferenceSchema)
      .max(MAX_SIGNUP_REFERENCES, "At most 3 references"),
    addressLine: z.string().trim().max(200, "Keep it under 200 characters"),
    city: z.string().trim().max(120, "Keep it under 120 characters"),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, "Use the two-letter state code")
      .or(z.literal("")),
    zip: z.string().trim().max(20, "Keep it under 20 characters"),
  })
  .superRefine((values, ctx) => {
    if (values.role === "company" && values.companyName === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company name is required",
      });
    }
  });
export type SignUpFormData = z.infer<typeof signUpSchema>;

export interface SignUpReferencePayload {
  name: string;
  company?: string;
  title?: string;
  phone?: string;
}

interface SignUpPayloadBase {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * POST /auth/sign-up body. A discriminated union so role-specific fields
 * cannot leak across roles (SignupRole & UserRole agree on these literals).
 */
export type SignUpPayload =
  | (SignUpPayloadBase & {
      role: Extract<SignupRole, "company">;
      companyName: string;
    })
  | (SignUpPayloadBase & {
      role: Extract<SignupRole, "recruiter">;
      yearsExperience?: number;
      specializations?: RecruiterSpecialization[];
      references?: SignUpReferencePayload[];
    });

function toReferencePayload(
  reference: SignUpReferenceValues,
): SignUpReferencePayload {
  return {
    name: reference.name,
    ...(reference.company === "" ? {} : { company: reference.company }),
    ...(reference.title === "" ? {} : { title: reference.title }),
    ...(reference.phone === "" ? {} : { phone: reference.phone }),
  };
}

/** Converts form values to the wire payload, omitting unset optional fields. */
export function toSignUpPayload(values: SignUpFormData): SignUpPayload {
  const base = {
    email: values.email,
    password: values.password,
    username: values.username,
    firstName: values.firstName,
    lastName: values.lastName,
    ...(values.phone === "" ? {} : { phone: values.phone }),
    ...(values.addressLine === "" ? {} : { addressLine: values.addressLine }),
    ...(values.city === "" ? {} : { city: values.city }),
    ...(values.state === "" ? {} : { state: values.state.toUpperCase() }),
    ...(values.zip === "" ? {} : { zip: values.zip }),
  };

  if (values.role === "company") {
    return { ...base, role: values.role, companyName: values.companyName };
  }

  return {
    ...base,
    role: values.role,
    ...(values.yearsExperience === ""
      ? {}
      : { yearsExperience: Number(values.yearsExperience) }),
    ...(values.specializations.length === 0
      ? {}
      : { specializations: values.specializations }),
    ...(values.references.length === 0
      ? {}
      : { references: values.references.map(toReferencePayload) }),
  };
}

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpFormData = z.infer<typeof otpSchema>;
