import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

import { formValuesToJobView } from "../utils/toJobView";
import type { JobFormValues, JobStatus } from "../schemas";
import { JobDetailBody } from "./JobDetailView";

interface JobLivePreviewProps {
  values: JobFormValues;
  /** The status shown as a badge in the panel header (defaults to a draft). */
  status?: JobStatus;
  /** Collapses the sidebar to its rail (handled by the parent layout). */
  onCollapse: () => void;
}

/** Badge tone + label for the status shown in the preview header. */
const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-50 text-amber-700" },
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-700",
  },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-700" },
  filled: { label: "Filled", className: "bg-primary/10 text-primary" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
  expired: { label: "Expired", className: "bg-red-50 text-red-700" },
};

/**
 * A live, read-only rendering of the job as recruiters will see it — driven
 * straight off the form's current values through the same `JobDetailBody` the
 * real detail page uses, so what a company sees here is what recruiters get.
 */
export function JobLivePreview({
  values,
  status = "draft",
  onCollapse,
}: JobLivePreviewProps) {
  const badge = STATUS_BADGE[status];

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recruiter view preview
          </p>
          <p className="text-[11px] text-muted-foreground">
            How this role appears to recruiters
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            badge.className,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {badge.label}
        </span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse preview"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="bg-muted/30 p-4 sm:p-5">
        <JobDetailBody job={formValuesToJobView(values)} preview />
      </div>
    </div>
  );
}
