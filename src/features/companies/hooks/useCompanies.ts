import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCompanies,
  fetchFollowedCompanies,
  type CompanyListParams,
} from "../api/companyProfiles";
import { followCompany, unfollowCompany } from "../api/follows";
import { companyKeys } from "../keys";

export function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => fetchCompanies(params),
  });
}

export function useFollowedCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: companyKeys.followed(params),
    queryFn: () => fetchFollowedCompanies(params),
  });
}

/**
 * Follow and unfollow share one hook because they invalidate the same lists —
 * `isFollowedByMe` lives on the company rows, so both must re-read.
 */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      isFollowed,
    }: {
      companyId: string;
      isFollowed: boolean;
    }) => (isFollowed ? unfollowCompany(companyId) : followCompany(companyId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}
