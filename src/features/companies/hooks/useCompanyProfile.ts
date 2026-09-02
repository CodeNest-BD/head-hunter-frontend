import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { accountDetailsUpdated } from "@/features/auth/store/authSlice";
import { useAppDispatch } from "@/shared/store/hooks";
import {
  deleteCompanyLogo,
  fetchMyCompanyProfile,
  reapplyCompanyVerification,
  updateMyCompanyProfile,
  uploadCompanyLogo,
  type UpdateCompanyProfileInput,
} from "../api/companyProfiles";
import { companyKeys } from "../keys";

export function useMyCompanyProfile({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: companyKeys.myProfile,
    queryFn: fetchMyCompanyProfile,
    enabled,
  });
}

export function useUpdateMyCompanyProfile() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (input: UpdateCompanyProfileInput) =>
      updateMyCompanyProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(companyKeys.myProfile, profile);
      // The contact's name and phone come from the User row the session was
      // built from, so the header and user menu need the new values too.
      dispatch(
        accountDetailsUpdated({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        }),
      );
      toast.success("Profile saved");
    },
  });
}

/**
 * Logo upload and removal share one cache update: both return the fresh
 * profile, so `hasLogo` (and every consumer reading it) flips the moment the
 * mutation resolves — no separate invalidation needed.
 */
export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(file),
    onSuccess: (profile) => {
      queryClient.setQueryData(companyKeys.myProfile, profile);
      toast.success("Logo updated");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not update the logo",
      ),
  });
}

export function useRemoveCompanyLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompanyLogo,
    onSuccess: (profile) => {
      queryClient.setQueryData(companyKeys.myProfile, profile);
      toast.success("Logo removed");
    },
    onError: () => toast.error("Could not remove the logo"),
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
