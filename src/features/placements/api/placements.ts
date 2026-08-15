import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";

import type { CompanyPlacementsParams } from "../keys";
import { companyPlacementSchema, type CompanyPlacement } from "../schemas";

/** GET /v1/company/placements */
export async function fetchCompanyPlacements(
  params: CompanyPlacementsParams,
): Promise<Paginated<CompanyPlacement>> {
  const { data } = await apiClient.get<unknown>("/company/placements", {
    params: {
      page: params.page,
      limit: params.limit ?? 25,
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    },
  });
  return paginatedSchema(companyPlacementSchema).parse(data);
}

/** POST /v1/company/placements/:id/dispute */
export async function raiseDispute(
  placementId: string,
  reason: string,
): Promise<void> {
  await apiClient.post<unknown>(`/company/placements/${placementId}/dispute`, {
    reason,
  });
}
