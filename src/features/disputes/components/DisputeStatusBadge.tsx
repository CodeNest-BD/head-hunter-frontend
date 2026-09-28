"use client";

import type { PillTone } from "@/shared/ui-components/badges/Pill";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";

import { DISPUTE_STATUS_LABELS, type DisputeStatus } from "../schemas";

/** Open needs action, under review is in flight, every resolution is settled. */
const STATUS_TONES: Record<DisputeStatus, PillTone> = {
  open: "warn",
  under_review: "info",
  resolved_release: "ok",
  resolved_refund: "ok",
  resolved_split: "ok",
  resolved_resumed: "ok",
  closed: "neutral",
};

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  return (
    <StatusBadge
      label={DISPUTE_STATUS_LABELS[status] ?? status}
      tone={STATUS_TONES[status] ?? "neutral"}
    />
  );
}
