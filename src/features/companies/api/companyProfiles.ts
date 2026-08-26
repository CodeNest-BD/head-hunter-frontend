import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  companyProfileSchema,
  companySummarySchema,
  presignedUploadSchema,
  reapplyCompanyVerificationResponseSchema,
  type CompanyProfile,
  type CompanySummary,
  type ReapplyCompanyVerificationResult,
} from "../schemas";

/**
 * Nullable, not merely optional: an omitted key leaves the field unchanged,
 * while an explicit null clears it. Sending undefined would be dropped by
 * axios, so a cleared field would silently keep its old value.
 */
/**
 * PATCH body. Mirrors the backend UpdateCompanyProfileDto: an omitted key
 * leaves the field alone, an explicit null clears it.
 */
export interface UpdateCompanyProfileInput {
  companyName?: string;
  website?: string | null;
  description?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  industry?: string | null;
  yearFounded?: number | null;
  employeeSize?: string | null;
  revenue?: string | null;
  // Both write to the User row. A name is never cleared — an account always has
  // one — so unlike the fields above these are optional but not nullable.
  firstName?: string;
  lastName?: string;
  // Writes to the User row, and resets phoneVerified whenever it changes.
  phone?: string | null;
  commissionRangeMinMinor?: number | null;
  commissionRangeMaxMinor?: number | null;
}

export interface CompanyListParams {
  page?: number;
  limit?: number;
  q?: string;
}

/** GET /v1/company-profiles/me */
export async function fetchMyCompanyProfile(): Promise<CompanyProfile> {
  const { data } = await apiClient.get<unknown>("/company-profiles/me");
  return companyProfileSchema.parse(data);
}

/** PATCH /v1/company-profiles/me */
export async function updateMyCompanyProfile(
  input: UpdateCompanyProfileInput,
): Promise<CompanyProfile> {
  const { data } = await apiClient.patch<unknown>(
    "/company-profiles/me",
    input,
  );
  return companyProfileSchema.parse(data);
}

/** GET /v1/company-profiles */
export async function fetchCompanies(
  params: CompanyListParams,
): Promise<Paginated<CompanySummary>> {
  const { data } = await apiClient.get<unknown>("/company-profiles", {
    params,
  });
  return paginatedSchema(companySummarySchema).parse(data);
}

/**
 * Upload a new company logo in the three steps the backend expects: ask for a
 * signed URL, PUT the bytes straight to storage, then record the key. The PUT
 * goes to storage directly (a raw fetch, not apiClient) so the file never
 * transits our API and no auth header leaks to the storage host.
 */
export async function uploadCompanyLogo(file: File): Promise<CompanyProfile> {
  const { data: presignData } = await apiClient.post<unknown>(
    "/company-profiles/me/logo/presign",
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

  const { data } = await apiClient.put<unknown>("/company-profiles/me/logo", {
    s3Key,
    sizeBytes: file.size,
  });
  return companyProfileSchema.parse(data);
}

/** DELETE /v1/company-profiles/me/logo */
export async function deleteCompanyLogo(): Promise<CompanyProfile> {
  const { data } = await apiClient.delete<unknown>("/company-profiles/me/logo");
  return companyProfileSchema.parse(data);
}

/**
 * POST /v1/company-profiles/me/reapply
 *
 * Legal only from `rejected`; the server 409s from `pending` or `verified`.
 */
export async function reapplyCompanyVerification(): Promise<ReapplyCompanyVerificationResult> {
  const { data } = await apiClient.post<unknown>(
    "/company-profiles/me/reapply",
  );
  return reapplyCompanyVerificationResponseSchema.parse(data);
}
