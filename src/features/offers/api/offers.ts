import { apiClient } from "@/shared/libs/apiClient";
import { paginatedSchema, type Paginated } from "@/shared/libs/pagination";
import { offerSchema, type Offer } from "../schemas";

export interface OfferListParams {
  page?: number;
  limit?: number;
  candidateId?: string;
  /** Narrows to one job's candidates, on top of the caller's own scoping. */
  jobId?: string;
}

/**
 * `amountMinor` is deliberately absent: the recruiter's commission is read
 * server-side from the job's advertised fee, never accepted from a client.
 */
export interface CreateOfferInput {
  candidateId: string;
  salaryMinor: number;
  jobTitle?: string;
  startDate?: string;
  notes?: string;
}

/** Same shape as `CreateOfferInput` minus `candidateId` — a counter already knows its candidate from the offer it supersedes. */
export interface CounterOfferInput {
  salaryMinor: number;
  jobTitle?: string;
  startDate?: string;
  notes?: string;
}

// Every write below suppresses the global error toast: 403 (wrong party, or
// the offer's own creator trying to accept/decline/withdraw it), 404 (a
// candidate or offer id that does not belong to the caller — deliberate, so
// it reveals nothing about whether the other id exists) and 409 (an offer no
// longer `sent`, or a candidate that already has a live offer) are all
// reachable in normal use, so the negotiation UI owns rendering them
// specifically, the same way `features/interviews/api/interviews.ts` owns its
// own 403/404/409s.

/**
 * POST /v1/offers — company only. `amountMinor` is never sent; the API reads
 * it from the job's `recruiterFeeMinor`. 404 when `candidateId` names a
 * candidate on another submission, 409 when that candidate already has an
 * offer awaiting a response.
 */
export async function createOffer(input: CreateOfferInput): Promise<Offer> {
  const { data } = await apiClient.post<unknown>("/offers", input, {
    suppressGlobalErrorToast: true,
  });
  return offerSchema.parse(data);
}

/** GET /v1/offers/:id — both parties. 404 when the offer is not visible to the caller. */
export async function fetchOffer(id: string): Promise<Offer> {
  const { data } = await apiClient.get<unknown>(`/offers/${id}`);
  return offerSchema.parse(data);
}

/** GET /v1/offers?candidateId=&jobId= — both parties, paginated. */
export async function fetchOffers(
  params: OfferListParams,
): Promise<Paginated<Offer>> {
  const { data } = await apiClient.get<unknown>("/offers", { params });
  return paginatedSchema(offerSchema).parse(data);
}

/**
 * POST /v1/offers/:id/counter — the other party from whoever sent `id`.
 * `amountMinor` is never sent; the API copies it from the offer being
 * countered. 403 when the offer's own creator tries to counter it, 404 when
 * `id` does not belong to the caller, 409 once the offer is no longer `sent`.
 */
export async function counterOffer(
  id: string,
  input: CounterOfferInput,
): Promise<Offer> {
  const { data } = await apiClient.post<unknown>(
    `/offers/${id}/counter`,
    input,
    { suppressGlobalErrorToast: true },
  );
  return offerSchema.parse(data);
}

/**
 * PATCH /v1/offers/:id/accept — 403 when the offer's own creator tries to
 * accept it, 404 when `id` does not belong to the caller, 409 once the offer
 * is no longer `sent`.
 */
export async function acceptOffer(id: string): Promise<Offer> {
  const { data } = await apiClient.patch<unknown>(
    `/offers/${id}/accept`,
    undefined,
    { suppressGlobalErrorToast: true },
  );
  return offerSchema.parse(data);
}

/**
 * PATCH /v1/offers/:id/decline — 403 when the offer's own creator tries to
 * decline it, 404 when `id` does not belong to the caller, 409 once the offer
 * is no longer `sent`.
 */
export async function declineOffer(id: string): Promise<Offer> {
  const { data } = await apiClient.patch<unknown>(
    `/offers/${id}/decline`,
    undefined,
    { suppressGlobalErrorToast: true },
  );
  return offerSchema.parse(data);
}

/**
 * PATCH /v1/offers/:id/withdraw — 403 when anyone but the offer's own creator
 * withdraws it, 404 when `id` does not belong to the caller, 409 once the
 * offer is no longer `sent`.
 */
export async function withdrawOffer(id: string): Promise<Offer> {
  const { data } = await apiClient.patch<unknown>(
    `/offers/${id}/withdraw`,
    undefined,
    { suppressGlobalErrorToast: true },
  );
  return offerSchema.parse(data);
}
