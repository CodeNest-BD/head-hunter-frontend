import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchMyCompanyProfile,
  reapplyCompanyVerification,
  updateMyCompanyProfile,
  type UpdateCompanyProfileInput,
} from "../api/companyProfiles";
import { companyKeys } from "../keys";

export function useMyCompanyProfile() {
  return useQuery({
    queryKey: companyKeys.myProfile,
    queryFn: fetchMyCompanyProfile,
  });
}

export function useUpdateMyCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyProfileInput) =>
      updateMyCompanyProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(companyKeys.myProfile, profile);
      toast.success("Profile saved");
    },
  });
}

/**
 * Re-opens a declined application. Only `rejected` → `pending` is legal, so a
 * 409 here means the status moved under the user — refetching the profile is
 * the honest response, not a retry.
 */
export function useReapplyCompanyVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reapplyCompanyVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyKeys.myProfile });
      toast.success("Re-submitted — an admin will review your account again");
    },
  });
}
