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
    <div className="flex flex-col gap-3">
      {/* `.facts` — an 11px uppercase label over its 13.5px/550 value. */}
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
        {candidate.currentCompany && (
          <div>
            <dt className={FACT_LABEL}>Current company</dt>
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
            <dt className={FACT_LABEL}>Expected salary</dt>
            <dd className={cn(FACT_VALUE, "font-[650] tabular-nums")}>
              {formatMinor(candidate.expectedSalaryMinor)}
            </dd>
          </div>
        )}
        {candidate.noticePeriodDays !== null && (
          <div>
            <dt className={FACT_LABEL}>Notice period</dt>
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
        <p className="whitespace-pre-wrap text-sub leading-relaxed text-ink-muted">
          {candidate.overview}
        </p>
      )}
    </div>
  );
}
