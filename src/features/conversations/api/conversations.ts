import { apiClient } from "@/shared/libs/apiClient";
import {
  conversationThreadSchema,
  markReadResponseSchema,
  messageSchema,
  submissionUnreadCountsSchema,
  unreadCountSchema,
  type ConversationThread,
  type Message,
} from "../schemas";

export type ThreadSortOrder = "ASC" | "DESC";

export interface ThreadParams {
  limit?: number;
  sortOrder?: ThreadSortOrder;
  candidateId?: string;
}

export interface SendMessageInput {
  body: string;
  candidateId?: string;
}

/** GET /v1/conversations/:submissionId — one page of the thread, `page` added by the hook. */
export async function fetchConversationThread(
  submissionId: string,
  params: ThreadParams & { page?: number },
): Promise<ConversationThread> {
  const { data } = await apiClient.get<unknown>(
    `/conversations/${submissionId}`,
    { params },
  );
  return conversationThreadSchema.parse(data);
}

/**
 * POST /v1/conversations/:submissionId/messages
 *
 * 409 when the submission is withdrawn or rejected, 429 once the 30/minute
 * limit is hit — the caller owns surfacing both, so the global error toast is
 * suppressed here (mirrors `createSubmission`'s 409 handling).
 */
export async function sendMessage(
  submissionId: string,
  input: SendMessageInput,
): Promise<Message> {
  const { data } = await apiClient.post<unknown>(
    `/conversations/${submissionId}/messages`,
    input,
    { suppressGlobalErrorToast: true },
  );
  return messageSchema.parse(data);
}

/** PATCH /v1/conversations/:submissionId/read */
export async function markThreadRead(submissionId: string): Promise<number> {
  const { data } = await apiClient.patch<unknown>(
    `/conversations/${submissionId}/read`,
  );
  return markReadResponseSchema.parse(data).updated;
}

/** GET /v1/conversations/unread-count */
export async function fetchMessageUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<unknown>("/conversations/unread-count");
  return unreadCountSchema.parse(data).unread;
}

/** GET /v1/conversations/unread-counts — unread messages per submission. */
export async function fetchMessageUnreadCounts(): Promise<
  Array<{ submissionId: string; unread: number }>
> {
  const { data } = await apiClient.get<unknown>("/conversations/unread-counts");
  return submissionUnreadCountsSchema.parse(data).counts;
}
