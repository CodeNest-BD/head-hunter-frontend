"use client";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";

import { DISPUTE_STATUS_LABELS, type DisputeStatus } from "../schemas";

const STATUS_STYLES: Record<DisputeStatus, string> = {
  open: "bg-[#FBF3DF] text-[#7A5109]",
  under_review: "bg-primary/15 text-primary",
  resolved_release: "bg-[#E7F4EC] text-[#17734E]",
  resolved_refund: "bg-[#E7F4EC] text-[#17734E]",
  resolved_split: "bg-[#E7F4EC] text-[#17734E]",
};

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  return (
    <StatusBadge
      label={DISPUTE_STATUS_LABELS[status] ?? status}
      className={STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}
    />
  );
}
