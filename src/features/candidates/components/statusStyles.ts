import type { PillTone } from "@/shared/ui-components/badges/Pill";

import type { CandidateStatus } from "../schemas";

/**
 * The semantic tone each candidate status wears, taken from the reference
 * mockups: a submission and a live interview read as information, a review that
 * has stalled as a warning, an offer as its own violet moment, a hire as the
 * good outcome, and a pass as neutral — it closes the thread, it is not a fault.
 *
 * Statuses name a tone rather than a color, so every candidate pill in the app
 * is drawn from the reference palette and a new status can never invent an
 * off-palette badge.
 */
export const CANDIDATE_STATUS_TONES: Record<CandidateStatus, PillTone> = {
  submitted: "info",
  reviewing: "warn",
  interviewing: "info",
  offered: "violet",
  hired: "ok",
  passed: "neutral",
};
