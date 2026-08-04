import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addReference,
  devActivateSubscription,
  fetchMyRecruiterProfile,
  removeReference,
  updateMyRecruiterProfile,
  type CreateReferenceInput,
  type UpdateRecruiterProfileInput,
} from "../api/recruiterProfiles";
import { recruiterKeys } from "../keys";

export function useMyRecruiterProfile() {
  return useQuery({
    queryKey: recruiterKeys.myProfile,
    queryFn: fetchMyRecruiterProfile,
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
