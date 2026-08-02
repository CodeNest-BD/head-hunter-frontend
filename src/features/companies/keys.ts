import type { CompanyListParams } from "./api/companyProfiles";

/**
 * One place defines this feature's cache namespace. Invalidation uses
 * `companyKeys.all` rather than a repeated ["companies"] literal, so renaming
 * the namespace is a single edit and cannot half-apply.
 */
export const companyKeys = {
  all: ["companies"] as const,
  myProfile: ["companies", "me"] as const,
  list: (params: CompanyListParams) => ["companies", "list", params] as const,
  followed: (params: CompanyListParams) =>
    ["companies", "followed", params] as const,
};
