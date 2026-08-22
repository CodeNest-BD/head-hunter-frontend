import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  companyProfileSchema,
  companySummarySchema,
  type CompanyProfile,
  type CompanySummary,
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

/** GET /v1/follows — companies the calling recruiter follows. */
export async function fetchFollowedCompanies(
  params: CompanyListParams,
): Promise<Paginated<CompanySummary>> {
  const { data } = await apiClient.get<unknown>("/follows", { params });
  return paginatedSchema(companySummarySchema).parse(data);
}
