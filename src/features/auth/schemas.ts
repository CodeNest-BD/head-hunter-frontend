import { z } from "zod";
import { personNameSchema } from "@/shared/libs/personName";
import {
  addressLineSchema,
  citySchema,
  stateSchema,
  zipSchema,
} from "@/shared/libs/usAddress";
import { phoneSchema } from "@/shared/libs/phone";
import { specializationsSchema } from "@/shared/utils/specializations";
import { signupRoleSchema, type SignupRole } from "./types";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignInFormData = z.infer<typeof signInSchema>;

export interface PasswordRequirement {
  readonly key: "length" | "uppercase" | "lowercase" | "number" | "special";
  readonly label: string;
  readonly test: (password: string) => boolean;
}

/**
 * The single source of truth for password complexity, shared by the sign-up
 * schema's validation and the SignUpForm's live checklist so the two can't
 * drift into different rules.
 */
export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    key: "uppercase",
    label: "An uppercase letter",
    test: (password) => /\p{Lu}/u.test(password),
  },
  {
    key: "lowercase",
    label: "A lowercase letter",
    test: (password) => /\p{Ll}/u.test(password),
  },
  {
    key: "number",
    label: "A number",
    test: (password) => /\d/u.test(password),
  },
  {
    key: "special",
    label: "A special character",
    test: (password) => /[^\p{L}\p{N}]/u.test(password),
  },
];

export const MAX_SIGNUP_REFERENCES = 3;
/** The client's questionnaire repeats the firm block five times. */
export const MAX_SIGNUP_EXPERIENCES = 5;

/** One staffing firm, as the sign-up form holds it. */
const signUpExperienceSchema = z.object({
  firmName: z
    .string()
    .trim()
    .min(1, "Firm name is required")
    .max(160, "Keep it under 160 characters"),
  years: z
    .string()
    .trim()
    .refine((value) => /^(\d|[1-7]\d|80)$/.test(value), {
      message: "Enter a number of years between 0 and 80",
    }),
  specializations: specializationsSchema,
});
export type SignUpExperienceValues = z.infer<typeof signUpExperienceSchema>;

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
 * name itself, a recruiter must supply at least one reference — lives in the
 * superRefine, matching the backend service check. The address is required for
 * both roles.
 *
 * No `username`: sign-in is by email and nothing ever looked an account up by
 * handle, so the concept was dropped from the platform entirely rather than
 * making the user invent a value with a failure mode they cannot predict.
 */
export const signUpSchema = z
  .object({
    role: signupRoleSchema,
    firstName: personNameSchema("First name"),
    lastName: personNameSchema("Last name"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .refine(
        (password) =>
          PASSWORD_REQUIREMENTS.every((requirement) =>
            requirement.test(password),
          ),
        {
          message:
            "Include an uppercase letter, a lowercase letter, a number and a special character",
        },
      ),
    confirmPassword: z.string(),
    // E.164 (any country) straight from the international phone input.
    phone: phoneSchema,
    companyName: z.string().trim().max(160, "Keep it under 160 characters"),
    linkedinUrl: z
      .string()
      .trim()
      .url("Enter a full URL, including https://")
      .or(z.literal("")),
    experiences: z
      .array(signUpExperienceSchema)
      .max(MAX_SIGNUP_EXPERIENCES, `At most ${MAX_SIGNUP_EXPERIENCES} firms`),
    references: z
      .array(signUpReferenceSchema)
      .max(MAX_SIGNUP_REFERENCES, "At most 3 references"),
    addressLine: addressLineSchema,
    city: citySchema,
    state: stateSchema,
    zip: zipSchema,
  })
  .superRefine((values, ctx) => {
    // Checked here rather than on the field so it re-runs when either half
    // changes; the backend enforces the same rule on SignUpDto.
    if (values.confirmPassword !== values.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
    if (values.role === "company" && values.companyName === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company name is required",
      });
    }
    if (values.role === "recruiter" && values.references.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["references"],
        message: "At least one reference is required",
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
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * POST /auth/sign-up body. A discriminated union so role-specific fields
 * cannot leak across roles (SignupRole & UserRole agree on these literals).
 */
export interface SignUpExperiencePayload {
  firmName: string;
  years: number;
  specializations?: string[];
}

export type SignUpPayload =
  | (SignUpPayloadBase & {
      role: Extract<SignupRole, "company">;
      companyName: string;
    })
  | (SignUpPayloadBase & {
      role: Extract<SignupRole, "recruiter">;
      linkedinUrl?: string;
      experiences?: SignUpExperiencePayload[];
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
    confirmPassword: values.confirmPassword,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    addressLine: values.addressLine,
    city: values.city,
    state: values.state.toUpperCase(),
    zip: values.zip,
  };

  if (values.role === "company") {
    return { ...base, role: values.role, companyName: values.companyName };
  }

  return {
    ...base,
    role: values.role,
    ...(values.linkedinUrl === "" ? {} : { linkedinUrl: values.linkedinUrl }),
    ...(values.experiences.length === 0
      ? {}
      : {
          experiences: values.experiences.map((firm) => ({
            firmName: firm.firmName,
            years: Number(firm.years),
            specializations: firm.specializations,
          })),
        }),
    ...(values.references.length === 0
      ? {}
      : { references: values.references.map(toReferencePayload) }),
  };
}

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpFormData = z.infer<typeof otpSchema>;
