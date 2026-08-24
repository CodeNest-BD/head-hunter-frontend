import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import {
  interviewSchema,
  proposalSchema,
  type Interview,
  type InterviewOutcome,
  type InterviewType,
  type Proposal,
} from "../schemas";

export interface InterviewListParams {
  page?: number;
  limit?: number;
  candidateId?: string;
  /** Narrows to one job's candidates, on top of the caller's own scoping. */
  jobId?: string;
}

export interface CreateInterviewInput {
  candidateId: string;
  interviewType: InterviewType;
}

export interface ProposeSlotsInput {
  slots: Array<{ startAt: string; endAt: string }>;
}

export interface RecordOutcomeInput {
  outcome: InterviewOutcome;
  /** Mandatory when `outcome` is `pass`. */
  passFeedback?: string;
}

// Every write below suppresses the global error toast: 403 (wrong party), 404
// (a slot/proposal id that does not belong to the named parent — deliberate,
// so it reveals nothing about whether the other id exists) and 409 (a
// proposal no longer open, an outcome already recorded, a candidate that
// already has an open interview) are all reachable in normal use, so the
// scheduling UI owns rendering them specifically, the same way
// `sendMessage` already owns its own 409s.

/**
 * POST /v1/interviews — company only. `round` is server-computed and must
 * not be sent. 409 when the candidate already has an interview awaiting a
 * time or scheduled.
 */
export async function createInterview(
  input: CreateInterviewInput,
): Promise<Interview> {
  const { data } = await apiClient.post<unknown>("/interviews", input, {
    suppressGlobalErrorToast: true,
  });
  return interviewSchema.parse(data);
}

/** GET /v1/interviews/:id — both parties. */
export async function fetchInterview(id: string): Promise<Interview> {
  const { data } = await apiClient.get<unknown>(`/interviews/${id}`);
  return interviewSchema.parse(data);
}

/** GET /v1/interviews?candidateId=&jobId= — both parties, paginated. */
export async function fetchInterviews(
  params: InterviewListParams,
): Promise<Paginated<Interview>> {
  const { data } = await apiClient.get<unknown>("/interviews", { params });
  return paginatedSchema(interviewSchema).parse(data);
}

/**
 * POST /v1/interviews/:id/proposals — company only, 1-5 slots. 403 when a
 * recruiter calls this, 409 once the interview is no longer awaiting a time.
 */
export async function proposeSlots(
  interviewId: string,
  input: ProposeSlotsInput,
): Promise<Proposal> {
  const { data } = await apiClient.post<unknown>(
    `/interviews/${interviewId}/proposals`,
    input,
    { suppressGlobalErrorToast: true },
  );
  return proposalSchema.parse(data);
}

/**
 * PATCH /v1/interviews/:id/proposals/:proposalId/confirm — recruiter only.
 * 403 for the wrong party, 404 when `slotId` is not part of this proposal,
 * 409 once this proposal is no longer open.
 */
export async function confirmSlot(
  interviewId: string,
  proposalId: string,
  slotId: string,
): Promise<Interview> {
  const { data } = await apiClient.patch<unknown>(
    `/interviews/${interviewId}/proposals/${proposalId}/confirm`,
    { slotId },
    { suppressGlobalErrorToast: true },
  );
  return interviewSchema.parse(data);
}

/**
 * PATCH /v1/interviews/:id/proposals/:proposalId/counter — recruiter only.
 * 403 for the wrong party, 409 once this proposal is no longer open.
 */
export async function counterRequest(
  interviewId: string,
  proposalId: string,
  note: string,
): Promise<Proposal> {
  const { data } = await apiClient.patch<unknown>(
    `/interviews/${interviewId}/proposals/${proposalId}/counter`,
    { note },
    { suppressGlobalErrorToast: true },
  );
  return proposalSchema.parse(data);
}

/**
 * PATCH /v1/interviews/:id/outcome — company only. `pass` requires
 * `passFeedback`. 409 when an outcome is already recorded or the interview
 * was canceled.
 */
export async function recordOutcome(
  interviewId: string,
  input: RecordOutcomeInput,
): Promise<Interview> {
  const { data } = await apiClient.patch<unknown>(
    `/interviews/${interviewId}/outcome`,
    input,
    { suppressGlobalErrorToast: true },
  );
  return interviewSchema.parse(data);
}

/**
 * PATCH /v1/interviews/:id/cancel — company only. 409 once already completed
 * or canceled.
 */
export async function cancelInterview(interviewId: string): Promise<Interview> {
  const { data } = await apiClient.patch<unknown>(
    `/interviews/${interviewId}/cancel`,
    undefined,
    { suppressGlobalErrorToast: true },
  );
  return interviewSchema.parse(data);
}

/**
 * PATCH /v1/interviews/:id/meeting-url — company only. Send `null` to clear
 * the link; the key must always be sent explicitly since axios drops
 * `undefined` body keys.
 */
export async function setMeetingUrl(
  interviewId: string,
  meetingJoinUrl: string | null,
): Promise<Interview> {
  const { data } = await apiClient.patch<unknown>(
    `/interviews/${interviewId}/meeting-url`,
    { meetingJoinUrl },
    { suppressGlobalErrorToast: true },
  );
  return interviewSchema.parse(data);
}
