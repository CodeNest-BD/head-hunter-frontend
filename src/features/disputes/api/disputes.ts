import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";

import {
  adminDisputeDetailSchema,
  adminDisputeListItemSchema,
  disputeMessageSchema,
  participantDisputeDetailSchema,
  participantDisputeSchema,
  type AdminDisputeDetail,
  type AdminDisputeListItem,
  type DisputeChannel,
  type DisputeMessage,
  type DisputeResolution,
  type ParticipantDispute,
  type ParticipantDisputeDetail,
} from "../schemas";

// ---- Participant (company / recruiter) --------------------------------

/** POST /v1/disputes — open a dispute on a held placement. */
export async function raiseDispute(input: {
  placementId: string;
  reason: string;
}): Promise<ParticipantDisputeDetail> {
  const { data } = await apiClient.post<unknown>("/disputes", input, {
    suppressGlobalErrorToast: true,
  });
  return participantDisputeDetailSchema.parse(data);
}

/** GET /v1/disputes — my disputes. */
export async function fetchMyDisputes(
  page: number,
): Promise<Paginated<ParticipantDispute>> {
  const { data } = await apiClient.get<unknown>("/disputes", {
    params: { page, limit: 20 },
  });
  return paginatedSchema(participantDisputeSchema).parse(data);
}

/** GET /v1/disputes/:id — my dispute with my private channel. */
export async function fetchMyDispute(
  id: string,
): Promise<ParticipantDisputeDetail> {
  const { data } = await apiClient.get<unknown>(`/disputes/${id}`);
  return participantDisputeDetailSchema.parse(data);
}

/** POST /v1/disputes/:id/messages — message the admin in my channel. */
export async function postDisputeMessage(
  id: string,
  body: string,
): Promise<DisputeMessage> {
  const { data } = await apiClient.post<unknown>(
    `/disputes/${id}/messages`,
    { body },
    { suppressGlobalErrorToast: true },
  );
  return disputeMessageSchema.parse(data);
}

// ---- Admin ------------------------------------------------------------

/** GET /v1/admin/disputes — the admin inbox. */
export async function fetchAdminDisputes(
  page: number,
  status?: string,
): Promise<Paginated<AdminDisputeListItem>> {
  const { data } = await apiClient.get<unknown>("/admin/disputes", {
    params: { page, limit: 25, ...(status ? { status } : {}) },
  });
  return paginatedSchema(adminDisputeListItemSchema).parse(data);
}

/** GET /v1/admin/disputes/:id — both channels + context. */
export async function fetchAdminDispute(
  id: string,
): Promise<AdminDisputeDetail> {
  const { data } = await apiClient.get<unknown>(`/admin/disputes/${id}`);
  return adminDisputeDetailSchema.parse(data);
}

/** POST /v1/admin/disputes/:id/messages — write into one party's channel. */
export async function postAdminDisputeMessage(
  id: string,
  channel: DisputeChannel,
  body: string,
): Promise<DisputeMessage> {
  const { data } = await apiClient.post<unknown>(
    `/admin/disputes/${id}/messages`,
    { channel, body },
    { suppressGlobalErrorToast: true },
  );
  return disputeMessageSchema.parse(data);
}

/** POST /v1/admin/disputes/:id/resolve — settle the escrowed fee. */
export async function resolveDispute(
  id: string,
  outcome: DisputeResolution,
  note?: string,
): Promise<AdminDisputeDetail> {
  const { data } = await apiClient.post<unknown>(
    `/admin/disputes/${id}/resolve`,
    { outcome, ...(note ? { note } : {}) },
    { suppressGlobalErrorToast: true },
  );
  return adminDisputeDetailSchema.parse(data);
}
