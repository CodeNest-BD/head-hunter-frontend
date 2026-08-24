import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

import { formValuesToJobView } from "../utils/toJobView";
import type { JobFormValues, JobStatus } from "../schemas";
import { JobDetailBody } from "./JobDetailView";

interface JobLivePreviewProps {
  values: JobFormValues;
  /** The status shown as a badge next to the title (defaults to a draft). */
  status?: JobStatus;
  /** Collapses the sidebar to its rail (handled by the parent layout). */
  onCollapse: () => void;
}

/** Badge tone + label for the status shown beside the preview title. */
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
 * A live, read-only rendering of the job as recruiters will see it on the
 * detail page — driven straight off the form's current values through the same
 * `JobDetailBody` the real page uses, so what a company sees here is what
 * recruiters get. Untitled drafts show a muted placeholder rather than a blank.
 */
export function JobLivePreview({
  values,
  status = "draft",
  onCollapse,
}: JobLivePreviewProps) {
  const view = formValuesToJobView(values);
  const title = view.title.trim();
  const badge = STATUS_BADGE[status];

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recruiter preview
          </p>
          <p className="text-[11px] text-muted-foreground">
            How this role appears in the feed
          </p>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse preview"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-6 bg-muted/30 p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              className={cn(
                "font-heading text-2xl font-extrabold tracking-tight",
                title ? "text-navy" : "text-muted-foreground/60",
              )}
            >
              {title || "Untitled role"}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                badge.className,
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {badge.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The fee, the role, and everything you need before you submit a
            candidate.
          </p>
        </div>
        <JobDetailBody job={view} compact />
      </div>
    </div>
  );
}
