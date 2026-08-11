import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Imported from the keys module directly, not the conversations barrel: the
// barrel also re-exports Thread and its realtime hook, which would drag the
// conversations API client into every module that merely wants to invalidate
// its cache — this hook only needs the static key array.
import { conversationKeys } from "@/features/conversations/keys";
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
  type CreateInterviewInput,
  type InterviewListParams,
  type ProposeSlotsInput,
  type RecordOutcomeInput,
} from "../api/interviews";
import { interviewKeys } from "../keys";

export function useInterview(id: string) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => fetchInterview(id),
  });
}

export function useInterviews(params: InterviewListParams) {
  return useQuery({
    queryKey: interviewKeys.list(params),
    queryFn: () => fetchInterviews(params),
  });
}

/**
 * Every scheduling mutation below invalidates both this feature's own keys
 * and `conversationKeys.all`: a new proposal, a confirmed slot, a recorded
 * outcome all change what the thread renders next — the same reasoning
 * `useSendMessage` already applies to a plain message.
 */
function useInvalidateOnScheduling(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: interviewKeys.all });
    void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
  };
}

export function useCreateInterview() {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: (input: CreateInterviewInput) => createInterview(input),
    onSuccess: invalidate,
  });
}

export function useProposeSlots(interviewId: string) {
  const invalidate = useInvalidateOnScheduling();
  return useMutation({
    mutationFn: (input: ProposeSlotsInput) => proposeSlots(interviewId, input),
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
