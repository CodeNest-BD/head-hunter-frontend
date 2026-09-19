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
  fetchDisputeAttentionCount,
  fetchMyDispute,
  fetchMyDisputes,
  postAdminDisputeMessage,
  postDisputeMessage,
  presignDisputeProof,
  raiseDispute,
} from "../api/disputes";
import { uploadToPresignedUrl } from "@/shared/libs/documentUpload";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
import { disputeKeys } from "../keys";
import type { DisputeChannel } from "../schemas";

// ---- Participant ------------------------------------------------------

export function useMyDisputes(page: number) {
  return useQuery({
    queryKey: disputeKeys.list(page),
    queryFn: () => fetchMyDisputes(page),
    placeholderData: keepPreviousData,
  });
}

/**
 * The Disputes nav badge. Polls on the notifications' interval and refetches on
 * focus, overriding the app-wide `refetchOnWindowFocus: false`: the count moves
 * when the admin decides a dispute, which produces no event this client waits
 * on — the same reasoning `useInboxAttentionCount` documents.
 */
export function useDisputeAttentionCount(enabled: boolean) {
  return useQuery({
    queryKey: disputeKeys.attentionCount,
    queryFn: fetchDisputeAttentionCount,
    enabled,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
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

/**
 * Opening a dispute freezes the placement, so the wallet view changes too.
 *
 * Proof uploads first and the dispute carries the keys, mirroring
 * `useSubmitCandidate`: the objects are staged against the placement, and the
 * storage lifecycle expires whatever a never-submitted form leaves behind.
 */
export function useRaiseDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      placementId: string;
      reason: string;
      proof?: File[];
    }) => {
      const attachments = await Promise.all(
        (input.proof ?? []).map(async (file) => {
          const staged = await presignDisputeProof(input.placementId, file);
          await uploadToPresignedUrl(staged.uploadUrl, file);
          return {
            s3Key: staged.s3Key,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          };
        }),
      );
      return raiseDispute({
        placementId: input.placementId,
        reason: input.reason,
        attachments,
      });
    },
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

export function useAdminDisputes(
  page: number,
  status?: string,
  raisedBy?: DisputeChannel,
) {
  return useQuery({
    queryKey: disputeKeys.adminList(page, status, raisedBy),
    queryFn: () => fetchAdminDisputes(page, status, raisedBy),
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
