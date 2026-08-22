import { format, startOfToday, subDays } from "date-fns";
import { z } from "zod";

import { MAX_MONEY_MAJOR, MAX_MONEY_MAJOR_LABEL } from "@/shared/utils/money";

/**
 * Read live from `/v1/offers`, not replayed from a historical feed — an
 * unrecognised value here means this client is genuinely out of date, so it
 * fails the parse loudly rather than degrading (unlike the tolerant
 * `offerStatus` on the conversation thread's `offer` event in
 * `features/conversations/schemas.ts`). Same reasoning as
 * `features/interviews/schemas.ts`'s `interviewStatusSchema`.
 */
export const OFFER_STATUSES = [
  "sent",
  "accepted",
  "declined",
  "countered",
  "superseded",
] as const;
export const offerStatusSchema = z.enum(OFFER_STATUSES);
export type OfferStatus = z.infer<typeof offerStatusSchema>;

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  countered: "Countered",
  superseded: "Superseded",
};

/** Which side sent this offer or counter-offer. */
export const offerPartySchema = z.enum(["company", "recruiter"]);
export type OfferParty = z.infer<typeof offerPartySchema>;

/**
 * Salary, title and start date agreed for the placement — mirrors the
 * backend's `PlacementDetails`. Every field is optional rather than nullable:
 * the entity stores whichever subset was supplied when the offer was sent.
 */
export const placementDetailsSchema = z.object({
  jobTitle: z.string().optional(),
  salaryMinor: z.number().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});
export type PlacementDetails = z.infer<typeof placementDetailsSchema>;

/**
 * Mirrors `OfferResponseDto`. `amountMinor` is the recruiter's commission,
 * read server-side from the job's advertised fee — present here for display
 * only; no request type in this feature accepts it back.
 */
export const offerSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  jobId: z.string(),
  previousOfferId: z.string().nullable(),
  createdBy: offerPartySchema,
  amountMinor: z.number(),
  status: offerStatusSchema,
  placementDetails: placementDetailsSchema.nullable(),
  createdAt: z.string(),
});
export type Offer = z.infer<typeof offerSchema>;

/**
 * The terms one party puts on the table — shared by `SendOfferForm` (the
 * opening offer) and `CounterOfferForm` (every counter after it). A counter
 * names the same three things under the same backend bounds, so it reuses this
 * rather than growing a near-duplicate free to drift out of step.
 *
 * Strings throughout, the same way `candidateFormSchema` and
 * `proposeSlotsFormSchema` keep form state — the salary is converted to minor
 * units at the submit boundary via `majorInputToMinor`, never inline
 * arithmetic. `salary` is required (a party has to name a number); the rest
 * mirror `CreateOfferInput`/`CounterOfferInput`'s optional fields.
 */
export const offerTermsFormSchema = z.object({
  salary: z
    .string()
    .trim()
    .min(1, "Salary is required")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "Enter a salary greater than 0",
    })
    .refine((value) => Number(value) <= MAX_MONEY_MAJOR, {
      message: `Salary must be under ${MAX_MONEY_MAJOR_LABEL}`,
    }),
  // No title field: the offer already belongs to one job, whose title the
  // recruiter and candidate both see on the submission.
  //
  // Mirrors the backend's floor exactly: a `YYYY-MM-DD` string carries no
  // offset, and real timezones span roughly UTC-12..UTC+14, so at any
  // instant two calendar dates are somebody's "today". The floor is
  // evaluated per validation, not once at module load, so it never goes
  // stale in a long-running process.
  startDate: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        value >= format(subDays(startOfToday(), 1), "yyyy-MM-dd"),
      { message: "Pick a start date of today or later" },
    ),
  notes: z.string().trim(),
});
export type OfferTermsFormValues = z.infer<typeof offerTermsFormSchema>;
