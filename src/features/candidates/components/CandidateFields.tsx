import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import type { Candidate } from "../schemas";

/** `.fact__label` / `.fact__value` — one pair, used by every fact below. */
const FACT_LABEL = "text-label font-[650] uppercase text-ink-muted";
const FACT_VALUE = "mt-[3px] text-body font-[550] text-ink";

interface CandidateFieldsProps {
  candidate: Candidate;
}

/**
 * The canonical candidate field display: current company, years of
 * experience, expected salary, notice period, then LinkedIn, with the
 * overview below. Every surface that shows a candidate's details renders
 * this in this order.
 */
export function CandidateFields({ candidate }: CandidateFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* `.facts` — an 11px uppercase label over its 13.5px/550 value. Sized
          by the panel's own width, not the viewport's, so a label never wraps
          into a column too narrow for it. */}
      <dl className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-3.5">
        {candidate.currentCompany && (
          <div>
            <dt className={FACT_LABEL}>Current Company</dt>
            <dd className={FACT_VALUE}>{candidate.currentCompany}</dd>
          </div>
        )}
        {candidate.yearsOfExperience !== null && (
          <div>
            <dt className={FACT_LABEL}>Experience</dt>
            <dd className={cn(FACT_VALUE, "tabular-nums")}>
              {candidate.yearsOfExperience} yrs
            </dd>
          </div>
        )}
        {candidate.expectedSalaryMinor !== null && (
          <div>
            <dt className={FACT_LABEL}>Expected Salary</dt>
            <dd className={cn(FACT_VALUE, "font-[650] tabular-nums")}>
              {formatMinor(candidate.expectedSalaryMinor)}
            </dd>
          </div>
        )}
        {candidate.noticePeriodDays !== null && (
          <div>
            <dt className={FACT_LABEL}>Notice Period</dt>
            <dd className={cn(FACT_VALUE, "tabular-nums")}>
              {candidate.noticePeriodDays} days
            </dd>
          </div>
        )}
        {candidate.linkedinUrl && (
          <div>
            <dt className={FACT_LABEL}>LinkedIn</dt>
            <dd className="mt-[3px]">
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-body font-[550] text-blue-ink underline-offset-2 hover:underline"
              >
                Profile
              </a>
            </dd>
          </div>
        )}
      </dl>

      {candidate.overview && (
        <div className="border-t border-line pt-3.5">
          <p className={FACT_LABEL}>Overview</p>
          <p className="mt-[3px] whitespace-pre-wrap text-sub leading-relaxed text-ink-body">
            {candidate.overview}
          </p>
        </div>
      )}
    </div>
  );
}
