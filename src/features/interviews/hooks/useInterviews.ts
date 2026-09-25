import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Imported from the keys module directly, not the conversations barrel: the
// barrel also re-exports Thread and its realtime hook, which would drag the
// conversations API client into every module that merely wants to invalidate
// its cache — this hook only needs the static key array.
import { conversationKeys } from "@/features/conversations/keys";
import { candidateKeys } from "@/features/candidates/keys";
import { inboxKeys } from "@/features/inbox/keys";
import {
  cancelInterview,
  confirmSlot,
  counterRequest,
  createInterview,
  fetchInterview,
  fetchInterviews,
  proposeSlots,
  recordOutcome,
  setMeetingUrl,
  type InterviewListParams,
  type ProposeSlotsInput,
  type RecordOutcomeInput,
} from "../api/interviews";
import type { InterviewType } from "../schemas";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
import { interviewKeys } from "../keys";

export function useInterview(id: string) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => fetchInterview(id),
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useInterviews(params: InterviewListParams) {
  return useQuery({
    queryKey: interviewKeys.list(params),
    queryFn: () => fetchInterviews(params),
    // The counterparty confirms slots, counters and records outcomes, so the
    // card has to learn about changes it did not make — see useOffers.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * Every scheduling mutation below changes the thread, the candidate's stage
 * and the inbox row as well as the interviews themselves: a new proposal, a
 * confirmed slot, a recorded outcome. The refetch is returned so the mutation
 * stays pending until the new state is on screen — see
 * `useInvalidateOnOffer` for why.
 */
function useInvalidateOnScheduling(): () => Promise<unknown> {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: interviewKeys.all }),
      queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
      queryClient.invalidateQueries({ queryKey: candidateKeys.all }),
      queryClient.invalidateQueries({ queryKey: inboxKeys.all }),
    ]);
}

/**
 * Which interview a batch of times is for: one that already exists, or one
 * this submit is about to open for a candidate. A union rather than an
 * optional id, so "no interview yet" carries the candidate it needs instead
 * of being a second nullable field the form has to cross-check.
 */
export type ProposeTimesTarget =
  | { kind: "existing"; interviewId: string }
  | { kind: "new"; candidateId: string; interviewType: InterviewType };

/**
 * Offering times, whether or not the interview exists yet. Creating the row
 * only once times are actually being sent is what keeps a company from
 * stranding a candidate on an interview that was opened and never filled in —
 * that empty `proposed` row blocks every later `createInterview` with a 409,
 * and withdrawing was the only way out of it.
 *
 * A created interview is remembered for the lifetime of the hook: if the
 * create lands but `proposeSlots` then fails (overlapping windows, a slot in
 * the past), retrying must reuse that interview — creating a second one can
 * only 409 against the first.
 */
export function useProposeInterviewTimes(target: ProposeTimesTarget) {
  const invalidate = useInvalidateOnScheduling();
  const createdInterviewId = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (input: ProposeSlotsInput) => {
      const interviewId =
        target.kind === "existing"
          ? target.interviewId
          : (createdInterviewId.current ??= (
              await createInterview({
                candidateId: target.candidateId,
                interviewType: target.interviewType,
              })
            ).id);
      return proposeSlots(interviewId, input);
    },
    onSuccess: invalidate,
  });
}

export function useConfirmSlot(interviewId: string, proposalId: string) {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: (slotId: string) =>
      confirmSlot(interviewId, proposalId, slotId),
    onSuccess: invalidate,
  });
}

export function useCounterRequest(interviewId: string, proposalId: string) {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: (note: string) => counterRequest(interviewId, proposalId, note),
    onSuccess: invalidate,
  });
}

export function useRecordOutcome(interviewId: string) {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: (input: RecordOutcomeInput) =>
      recordOutcome(interviewId, input),
    onSuccess: invalidate,
  });
}

export function useCancelInterview(interviewId: string) {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: () => cancelInterview(interviewId),
    onSuccess: invalidate,
  });
}

export function useSetMeetingUrl(interviewId: string) {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: (meetingJoinUrl: string | null) =>
      setMeetingUrl(interviewId, meetingJoinUrl),
    onSuccess: invalidate,
  });
}
