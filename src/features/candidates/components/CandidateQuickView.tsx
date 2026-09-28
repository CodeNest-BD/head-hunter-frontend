"use client";

import { useState, type ReactNode } from "react";
import { Eye, Loader2 } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui-components/controls/popover";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { formatMinor } from "@/shared/utils/money";

import { useCandidate } from "../hooks/useCandidates";
import { CANDIDATE_STATUS_LABELS } from "../schemas";
import { CandidateAttachments } from "./CandidateAttachments";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";

interface CandidateQuickViewProps {
  candidateId: string;
  /** Names the trigger for assistive tech, so it is never a bare "view". */
  name: string;
}

/** One label/value line in the summary grid. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-label font-[650] uppercase text-ink-muted">{label}</p>
      <p className="mt-[3px] break-words text-sub font-[550] text-ink">
        {children}
      </p>
    </div>
  );
}

/**
 * A candidate's summary without leaving the table: the eye beside their name
 * opens a popover with who they are, where they stand, and their files.
 *
 * Nothing is fetched until it is opened — a fifty-row table would otherwise
 * fire fifty requests, and every attachment call mints fresh presigned URLs.
 * The resume opens through the app's existing preview dialog, which portals
 * out, so the table's own clipping cannot swallow it.
 */
export function CandidateQuickView({
  candidateId,
  name,
}: CandidateQuickViewProps) {
  const [open, setOpen] = useState(false);
  const candidate = useCandidate(candidateId, open);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Quick view of ${name}`}
          // The row itself opens the conversation, so this must not bubble.
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-xs transition-colors",
            open
              ? "bg-tint text-blue"
              : "text-ink-faint hover:bg-surface-sunken hover:text-ink",
          )}
        >
          <Eye className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0"
        onClick={(event) => event.stopPropagation()}
      >
        {candidate.isPending ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-ink-faint">
            <Loader2 className="size-[15px] animate-spin" />
            <span className="text-sub">Loading…</span>
          </div>
        ) : candidate.isError ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sub text-bad">Could not load this candidate.</p>
            <button
              type="button"
              onClick={() => void candidate.refetch()}
              className="mt-2 text-meta font-[550] text-blue-ink hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2.5 border-b border-line px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-card font-[650] text-ink">
                  {candidate.data.fullName}
                </p>
                {candidate.data.currentCompany && (
                  <p className="truncate text-meta text-ink-muted">
                    {candidate.data.currentCompany}
                  </p>
                )}
              </div>
              <StatusBadge
                label={CANDIDATE_STATUS_LABELS[candidate.data.status]}
                tone={CANDIDATE_STATUS_TONES[candidate.data.status]}
              />
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Experience">
                  {candidate.data.yearsOfExperience === null
                    ? "Not set"
                    : `${candidate.data.yearsOfExperience} yrs`}
                </Fact>
                <Fact label="Expected Pay">
                  {candidate.data.expectedSalaryMinor === null
                    ? "Not set"
                    : formatMinor(candidate.data.expectedSalaryMinor)}
                </Fact>
                <Fact label="Notice Period">
                  {candidate.data.noticePeriodDays === null
                    ? "Not set"
                    : `${candidate.data.noticePeriodDays} days`}
                </Fact>
                <Fact label="Phone">{candidate.data.phone ?? "Not set"}</Fact>
              </div>

              {candidate.data.pitch && (
                <div className="rounded-sm border border-line bg-surface-sub px-3 py-2.5">
                  <p className="text-label font-[650] uppercase text-ink-muted">
                    Recruiter&rsquo;s Pitch
                  </p>
                  <p className="mt-1 line-clamp-4 text-sub leading-relaxed text-ink-body">
                    {candidate.data.pitch}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-label font-[650] uppercase text-ink-muted">
                  Files
                </p>
                <CandidateAttachments
                  candidateId={candidateId}
                  enabled={open}
                />
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
