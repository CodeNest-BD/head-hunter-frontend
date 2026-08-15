import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchCompanyPlacements, raiseDispute } from "../api/placements";
import { placementKeys, type CompanyPlacementsParams } from "../keys";

export function useCompanyPlacements(params: CompanyPlacementsParams) {
  return useQuery({
    queryKey: placementKeys.companyList(params),
    queryFn: () => fetchCompanyPlacements(params),
    placeholderData: keepPreviousData,
  });
}

export function useRaiseDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      placementId,
      reason,
    }: {
      placementId: string;
      reason: string;
    }) => raiseDispute(placementId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: placementKeys.all });
    },
  });
}
