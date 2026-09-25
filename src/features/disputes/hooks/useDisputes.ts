import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Role } from "@/features/auth";
import { notificationKeys } from "@/features/notifications/keys";

import {
  fetchAdminDispute,
  fetchAdminDisputeAttentionCount,
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
import type { DisputeChannel, DisputeStatus } from "../schemas";

// ---- Participant ------------------------------------------------------

/** Polls like the nav badge: an admin reply or a decision produces no event
 * this client listens for, and the list's order and "new" marker move with
 * them. */
export function useMyDisputes(page: number) {
  return useQuery({
    queryKey: disputeKeys.list(page),
    queryFn: () => fetchMyDisputes(page),
    placeholderData: keepPreviousData,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
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

/**
 * Opening a dispute marks its notifications read server-side, so the fetch
 * leaves the list's "new" marker and the notification bell stale — both are
 * invalidated here, the participant counterpart of `useAdminDispute`.
 */
export function useMyDispute(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: disputeKeys.detail(id),
    queryFn: async () => {
      const dispute = await fetchMyDispute(id);
      void queryClient.invalidateQueries({ queryKey: disputeKeys.lists });
      void queryClient.invalidateQueries({
        queryKey: disputeKeys.attentionCount,
      });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      return dispute;
    },
    // Keeps an open dispute showing new admin replies — and, since each fetch
    // marks read, stops them lighting the list and bell while being read.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
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

/** The admin's Disputes nav badge, polled like the participants' own. */
export function useAdminDisputeAttentionCount(enabled: boolean) {
  return useQuery({
    queryKey: disputeKeys.adminAttentionCount,
    queryFn: fetchAdminDisputeAttentionCount,
    enabled,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAdminDisputes(
  page: number,
  statuses?: readonly DisputeStatus[],
  raisedBy?: DisputeChannel,
) {
  return useQuery({
    queryKey: disputeKeys.adminList(page, statuses, raisedBy),
    queryFn: () => fetchAdminDisputes(page, statuses, raisedBy),
    placeholderData: keepPreviousData,
  });
}

/**
 * Opening a dispute is what marks it reviewed server-side, so the fetch leaves
 * the nav badge and the list's unread tint stale — both are invalidated here
 * rather than waiting out the badge's poll interval.
 */
export function useAdminDispute(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: disputeKeys.adminDetail(id),
    queryFn: async () => {
      const dispute = await fetchAdminDispute(id);
      void queryClient.invalidateQueries({
        queryKey: disputeKeys.adminAttentionCount,
      });
      void queryClient.invalidateQueries({
        queryKey: disputeKeys.adminLists,
      });
      return dispute;
    },
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
