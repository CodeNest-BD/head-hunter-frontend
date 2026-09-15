import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Role } from "@/features/auth";

import {
  fetchAdminDispute,
  fetchAdminDisputes,
  fetchEligiblePlacements,
  fetchMyDispute,
  fetchMyDisputes,
  postAdminDisputeMessage,
  postDisputeMessage,
  raiseDispute,
  resolveDispute,
} from "../api/disputes";
import { disputeKeys } from "../keys";
import type { DisputeChannel, DisputeResolution } from "../schemas";

// ---- Participant ------------------------------------------------------

export function useMyDisputes(page: number) {
  return useQuery({
    queryKey: disputeKeys.list(page),
    queryFn: () => fetchMyDisputes(page),
    placeholderData: keepPreviousData,
  });
}

export function useMyDispute(id: string) {
  return useQuery({
    queryKey: disputeKeys.detail(id),
    queryFn: () => fetchMyDispute(id),
  });
}

/** Held placements the caller can open a dispute on. */
export function useEligiblePlacements(role: Role | null) {
  return useQuery({
    queryKey: disputeKeys.eligiblePlacements(role ?? "none"),
    queryFn: () => (role ? fetchEligiblePlacements(role) : Promise.resolve([])),
    enabled: role === "company" || role === "recruiter",
  });
}

/** Opening a dispute freezes the placement, so the wallet view changes too. */
export function useRaiseDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { placementId: string; reason: string }) =>
      raiseDispute(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function usePostDisputeMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => postDisputeMessage(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disputeKeys.detail(id) });
    },
  });
}

// ---- Admin ------------------------------------------------------------

export function useAdminDisputes(page: number, status?: string) {
  return useQuery({
    queryKey: disputeKeys.adminList(page, status),
    queryFn: () => fetchAdminDisputes(page, status),
    placeholderData: keepPreviousData,
  });
}

export function useAdminDispute(id: string) {
  return useQuery({
    queryKey: disputeKeys.adminDetail(id),
    queryFn: () => fetchAdminDispute(id),
  });
}

export function usePostAdminDisputeMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { channel: DisputeChannel; body: string }) =>
      postAdminDisputeMessage(id, input.channel, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: disputeKeys.adminDetail(id),
      });
    },
  });
}

/** Resolving moves escrow money, so wallet and dispute views both change. */
export function useResolveDispute(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { outcome: DisputeResolution; note?: string }) =>
      resolveDispute(id, input.outcome, input.note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
