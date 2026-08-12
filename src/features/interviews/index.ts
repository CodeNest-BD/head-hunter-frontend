"use client";

// The barrel is a client boundary: it re-exports hooks and components that use
// client-only React APIs, so a Server Component importing this file must not
// pull them into the server graph.
/** Public surface of the interviews feature. */
export { OpenInterviewActions } from "./components/OpenInterviewActions";
export { ProposeSlotsForm } from "./components/ProposeSlotsForm";
export {
  useCancelInterview,
  useConfirmSlot,
  useCounterRequest,
  useCreateInterview,
  useInterview,
  useInterviews,
  useProposeSlots,
  useRecordOutcome,
  useSetMeetingUrl,
} from "./hooks/useInterviews";
export { interviewKeys } from "./keys";
export {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  MAX_PROPOSAL_SLOTS,
  MIN_PROPOSAL_SLOTS,
} from "./schemas";
export {
  createInterviewErrorMessage,
  withdrawInterviewErrorMessage,
} from "./utils/interviewErrorMessages";
export type { OpenInterviewPanel } from "./components/OpenInterviewActions";
export type {
  Interview,
  InterviewOutcome,
  InterviewSlot,
  InterviewStatus,
  InterviewType,
  Proposal,
  ProposalStatus,
} from "./schemas";
