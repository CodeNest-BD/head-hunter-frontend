import type { PillTone } from "@/shared/ui-components/badges/Pill";

import type { CandidateStatus } from "../schemas";

/**
 * The semantic tone each candidate status wears. Statuses name a tone rather
 * than a color, so every candidate pill in the app is drawn from the reference
 * palette and a new status can never invent an off-palette badge.
 */
export const CANDIDATE_STATUS_TONES: Record<CandidateStatus, PillTone> = {
  submitted: "info",
  reviewing: "warn",
  interviewing: "warn",
  offered: "ok",
  hired: "ok",
  // Red, matching the inbox list and the admin views: passed is an outcome,
  // not an absence of one.
  passed: "bad",
};
