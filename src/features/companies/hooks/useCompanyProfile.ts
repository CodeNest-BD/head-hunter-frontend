import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchMyCompanyProfile,
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
