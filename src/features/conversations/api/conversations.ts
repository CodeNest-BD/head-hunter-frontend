import { apiClient } from "@/shared/libs/apiClient";
import {
  candidateUnreadCountsSchema,
  conversationThreadSchema,
  markReadResponseSchema,
  messageSchema,
  unreadCountSchema,
  type ConversationThread,
  type Message,
} from "../schemas";

export type ThreadSortOrder = "ASC" | "DESC";

export interface ThreadParams {
  limit?: number;
  sortOrder?: ThreadSortOrder;
}

export interface SendMessageInput {
  body: string;
}

/**
 * GET /v1/conversations/candidates/:candidateId — one page of the thread,
 * `page` added by the hook. A conversation is one candidate: the header comes
 * back with that candidate, both parties and the job, so the split view is a
 * single request.
 */
export async function fetchConversationThread(
  candidateId: string,
  params: ThreadParams & { page?: number },
): Promise<ConversationThread> {
  const { data } = await apiClient.get<unknown>(
    `/conversations/candidates/${candidateId}`,
    { params },
  );
  return conversationThreadSchema.parse(data);
}

/**
 * POST /v1/conversations/candidates/:candidateId/messages
 *
 * 409 once the candidate is passed on, 429 at the 30/minute limit — the caller
 * owns surfacing both, so the global error toast is suppressed here.
 */
export async function sendMessage(
  candidateId: string,
  input: SendMessageInput,
): Promise<Message> {
  const { data } = await apiClient.post<unknown>(
    `/conversations/candidates/${candidateId}/messages`,
    input,
    { suppressGlobalErrorToast: true },
  );
  return messageSchema.parse(data);
}

/** PATCH /v1/conversations/candidates/:candidateId/read */
export async function markThreadRead(candidateId: string): Promise<number> {
  const { data } = await apiClient.patch<unknown>(
    `/conversations/candidates/${candidateId}/read`,
  );
  return markReadResponseSchema.parse(data).updated;
}

/** GET /v1/conversations/unread-count */
export async function fetchMessageUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<unknown>("/conversations/unread-count");
  return unreadCountSchema.parse(data).unread;
}

/** GET /v1/conversations/unread-counts — unread messages per candidate. */
export async function fetchMessageUnreadCounts(): Promise<
  Array<{ candidateId: string; jobId: string; unread: number }>
> {
  const { data } = await apiClient.get<unknown>("/conversations/unread-counts");
  return candidateUnreadCountsSchema.parse(data).counts;
}
