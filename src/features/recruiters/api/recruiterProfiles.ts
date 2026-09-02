import { apiClient } from "@/shared/libs/apiClient";
import {
  presignedUploadSchema,
  reapplyRecruiterVerificationResponseSchema,
  recruiterProfileSchema,
  recruiterReferenceSchema,
  type ReapplyRecruiterVerificationResult,
  type RecruiterProfile,
  type RecruiterReference,
} from "../schemas";

/**
 * Upload a recruiter's profile photo in the three steps the backend expects:
 * ask for a signed URL, PUT the bytes straight to storage, then record the key.
 * Mirrors the company-logo flow exactly.
 *
 * BACKEND CONTRACT (not yet implemented): needs
 *   POST   /recruiter-profiles/me/photo/presign  -> { s3Key, uploadUrl }
 *   PUT    /recruiter-profiles/me/photo          <- { s3Key, sizeBytes }  -> RecruiterProfile
 *   DELETE /recruiter-profiles/me/photo                                    -> RecruiterProfile
 *   GET    /recruiter-profiles/:id/photo         -> 302 to a signed S3 link
 * plus a `hasPhoto` boolean on the recruiter profile.
 */
export async function uploadRecruiterPhoto(
  file: File,
): Promise<RecruiterProfile> {
  const { data: presignData } = await apiClient.post<unknown>(
    "/recruiter-profiles/me/photo/presign",
    { fileName: file.name, contentType: file.type },
  );
  const { s3Key, uploadUrl } = presignedUploadSchema.parse(presignData);

  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) {
    throw new Error("Could not upload the image. Please try again.");
  }

  const { data } = await apiClient.put<unknown>(
    "/recruiter-profiles/me/photo",
    {
      s3Key,
      sizeBytes: file.size,
    },
  );
  return recruiterProfileSchema.parse(data);
}

/** DELETE /v1/recruiter-profiles/me/photo */
export async function deleteRecruiterPhoto(): Promise<RecruiterProfile> {
  const { data } = await apiClient.delete<unknown>(
    "/recruiter-profiles/me/photo",
  );
  return recruiterProfileSchema.parse(data);
}

/** null clears a field; an omitted key leaves it unchanged. */
/** One firm as the API takes it. */
export interface RecruiterExperienceInput {
  firmName: string;
  years: number;
  specializations?: string[];
}

/**
 * PATCH body. An omitted key leaves the field alone; an explicit null clears
 * it. `experiences` replaces the whole list, so omit it to leave the firms
 * untouched and send [] to clear them.
 */
export interface UpdateRecruiterProfileInput {
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  linkedinUrl?: string | null;
  // Writes to the User row, and resets phoneVerified whenever it changes.
  phone?: string | null;
  experiences?: RecruiterExperienceInput[];
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
 * POST /v1/recruiter-profiles/me/reapply
 *
 * Legal only from `rejected`; the server 409s from `pending` or `verified`.
 */
export async function reapplyRecruiterVerification(): Promise<ReapplyRecruiterVerificationResult> {
  const { data } = await apiClient.post<unknown>(
    "/recruiter-profiles/me/reapply",
  );
  return reapplyRecruiterVerificationResponseSchema.parse(data);
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
