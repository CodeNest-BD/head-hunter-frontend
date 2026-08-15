export interface CompanyPlacementsParams {
  page: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export const placementKeys = {
  all: ["placements"] as const,
  companyList: (params: CompanyPlacementsParams) =>
    ["placements", "company", params] as const,
};
