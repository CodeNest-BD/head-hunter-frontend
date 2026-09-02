import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addReference,
  deleteRecruiterPhoto,
  devActivateSubscription,
  fetchMyRecruiterProfile,
  reapplyRecruiterVerification,
  removeReference,
  updateMyRecruiterProfile,
  uploadRecruiterPhoto,
  type CreateReferenceInput,
  type UpdateRecruiterProfileInput,
} from "../api/recruiterProfiles";
import { recruiterKeys } from "../keys";

export function useMyRecruiterProfile({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recruiterKeys.myProfile,
    queryFn: fetchMyRecruiterProfile,
    enabled,
  });
}

export function useUpdateMyRecruiterProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRecruiterProfileInput) =>
      updateMyRecruiterProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(recruiterKeys.myProfile, profile);
      toast.success("Profile saved");
    },
  });
}

export function useUploadRecruiterPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadRecruiterPhoto(file),
    onSuccess: (profile) => {
      queryClient.setQueryData(recruiterKeys.myProfile, profile);
      toast.success("Photo updated");
    },
    onError: () =>
      toast.error("Could not upload your photo. Please try again."),
  });
}

export function useRemoveRecruiterPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteRecruiterPhoto(),
    onSuccess: (profile) => {
      queryClient.setQueryData(recruiterKeys.myProfile, profile);
      toast.success("Photo removed");
    },
  });
}

export function useAddReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReferenceInput) => addReference(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.myProfile });
      toast.success("Reference added");
    },
  });
}

export function useRemoveReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeReference(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.myProfile });
    },
  });
}

/**
 * Re-submits a declined recruiter for review. Only legal from `rejected` —
 * the server 409s otherwise — so this is wired to the banner's Re-apply
 * action, not offered while pending or verified.
 */
export function useReapplyRecruiterVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reapplyRecruiterVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.myProfile });
      toast.success("Re-application submitted — an admin will review it");
    },
  });
}

/** Temporary: stands in for Stripe Checkout until billing exists. */
export function useDevActivateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devActivateSubscription,
    onSuccess: (profile) => {
      queryClient.setQueryData(recruiterKeys.myProfile, profile);
      // Job queries 403 without an active subscription; refetch now that it is.
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Subscription active — the job map is now open");
    },
  });
}
