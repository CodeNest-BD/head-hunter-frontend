import { z } from "zod";

import type { Role } from "@/features/auth";
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

// ---- Eligible placements (for the raise picker) -----------------------

/** A held placement the caller can open a dispute on. */
export interface EligiblePlacement {
  placementId: string;
  label: string;
  amountMinor: number;
}

const companyPlacementRow = z.object({
  placementId: z.string(),
  status: z.string(),
  jobTitle: z.string(),
  candidateName: z.string(),
  amountMinor: z.number(),
});

const recruiterPlacementRow = z.object({
  placementId: z.string(),
  status: z.string(),
  jobTitle: z.string(),
  companyName: z.string(),
  amountMinor: z.number(),
});

/**
 * The caller's placements still held in escrow — the only ones a dispute can be
 * opened on. Reads the company or recruiter placements endpoint (not the billing
 * feature, to keep disputes free of a billing import) and keeps just the held
 * rows. A generous page size covers all but the largest books in one call.
 */
export async function fetchEligiblePlacements(
  role: Role,
): Promise<EligiblePlacement[]> {
  if (role === "company") {
    const { data } = await apiClient.get<unknown>("/company/placements", {
      params: { page: 1, limit: 100 },
    });
    return paginatedSchema(companyPlacementRow)
      .parse(data)
      .data.filter((p) => p.status === "held")
      .map((p) => ({
        placementId: p.placementId,
        label: `${p.candidateName} · ${p.jobTitle}`,
        amountMinor: p.amountMinor,
      }));
  }
  if (role === "recruiter") {
    const { data } = await apiClient.get<unknown>(
      "/recruiter/wallet/placements",
      { params: { page: 1, limit: 100 } },
    );
    return paginatedSchema(recruiterPlacementRow)
      .parse(data)
      .data.filter((p) => p.status === "held")
      .map((p) => ({
        placementId: p.placementId,
        label: `${p.jobTitle} · ${p.companyName}`,
        amountMinor: p.amountMinor,
      }));
  }
  return [];
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
