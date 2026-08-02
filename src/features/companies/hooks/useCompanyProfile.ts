import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchMyCompanyProfile,
  updateMyCompanyProfile,
  type UpdateCompanyProfileInput,
} from "../api/companyProfiles";

export const myCompanyProfileKey = ["company-profile", "me"] as const;

export function useMyCompanyProfile() {
  return useQuery({
    queryKey: myCompanyProfileKey,
    queryFn: fetchMyCompanyProfile,
  });
}

export function useUpdateMyCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyProfileInput) =>
      updateMyCompanyProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(myCompanyProfileKey, profile);
      toast.success("Profile saved");
    },
  });
}
