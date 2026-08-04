import { apiClient } from "@/shared/libs/apiClient";
import {
  recruiterProfileSchema,
  recruiterReferenceSchema,
  type RecruiterProfile,
  type RecruiterReference,
  type Specialization,
} from "../schemas";

/** null clears a field; an omitted key leaves it unchanged. */
export interface UpdateRecruiterProfileInput {
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  yearsExperience?: number | null;
  specializations?: Specialization[] | null;
}

export interface CreateReferenceInput {
  name: string;
  company?: string;
  title?: string;
  phone?: string;
}

/** GET /v1/recruiter-profiles/me */
export async function fetchMyRecruiterProfile(): Promise<RecruiterProfile> {
  const { data } = await apiClient.get<unknown>("/recruiter-profiles/me");
  return recruiterProfileSchema.parse(data);
}

/** PATCH /v1/recruiter-profiles/me */
export async function updateMyRecruiterProfile(
  input: UpdateRecruiterProfileInput,
): Promise<RecruiterProfile> {
  const { data } = await apiClient.patch<unknown>(
    "/recruiter-profiles/me",
    input,
  );
  return recruiterProfileSchema.parse(data);
}

/** POST /v1/recruiter-profiles/me/references */
export async function addReference(
  input: CreateReferenceInput,
): Promise<RecruiterReference> {
  const { data } = await apiClient.post<unknown>(
    "/recruiter-profiles/me/references",
    input,
  );
  return recruiterReferenceSchema.parse(data);
}

/** DELETE /v1/recruiter-profiles/me/references/:id */
export async function removeReference(id: string): Promise<void> {
  await apiClient.delete(`/recruiter-profiles/me/references/${id}`);
}

/**
 * POST /v1/recruiter-profiles/me/subscription/dev-activate
 *
 * Temporary stand-in for Stripe Checkout — the backend refuses it in
 * production. Remove alongside the server endpoint when billing lands.
 */
export async function devActivateSubscription(): Promise<RecruiterProfile> {
  const { data } = await apiClient.post<unknown>(
    "/recruiter-profiles/me/subscription/dev-activate",
  );
  return recruiterProfileSchema.parse(data);
}
