import { Money } from "@/shared/ui-components/data/MoneyVisibility";
import type { Candidate } from "../schemas";

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
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {candidate.currentCompany && (
          <div>
            <dt className="text-xs text-muted-foreground">Current company</dt>
            <dd className="text-foreground">{candidate.currentCompany}</dd>
          </div>
        )}
        {candidate.yearsOfExperience !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="text-foreground">
              {candidate.yearsOfExperience} yrs
            </dd>
          </div>
        )}
        {candidate.expectedSalaryMinor !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">Expected salary</dt>
            <dd className="text-foreground">
              <Money minor={candidate.expectedSalaryMinor} />
            </dd>
          </div>
        )}
        {candidate.noticePeriodDays !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">Notice period</dt>
            <dd className="text-foreground">
              {candidate.noticePeriodDays} days
            </dd>
          </div>
        )}
        {candidate.linkedinUrl && (
          <div>
            <dt className="text-xs text-muted-foreground">LinkedIn</dt>
            <dd>
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                Profile
              </a>
            </dd>
          </div>
        )}
      </dl>

      {candidate.overview && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {candidate.overview}
        </p>
      )}
    </div>
  );
}
