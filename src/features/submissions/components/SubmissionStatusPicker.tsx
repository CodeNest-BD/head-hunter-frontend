"use client";

import { useUpdateSubmissionStatus } from "../hooks/useSubmissions";
import {
  COMPANY_SETTABLE_STATUSES,
  SUBMISSION_STATUS_LABELS,
  isCompanySettableStatus,
  type Submission,
} from "../schemas";

/**
 * The company's control for moving a submission's status.
 *
 * It offers only the statuses the platform reacts to — see
 * COMPANY_SETTABLE_STATUSES. `under_review` and `advanced` are deliberately
 * absent: they are displayable but not settable, so offering them here would
 * hand the company a choice that changes nothing (and the API rejects them).
 * A submission already sitting on one of them shows its real status as a
 * read-only option, so the control never misreports where the submission is.
 */
export function SubmissionStatusPicker({
  submission,
}: {
  submission: Submission;
}) {
  const updateStatus = useUpdateSubmissionStatus(submission.id);
  const isSettable = isCompanySettableStatus(submission.status);

  return (
    /* The visible label is dropped: the select already carries an aria-label,
       and the badge beside the recruiter's name says what the status is. */
    <select
      id="submission-status"
      aria-label="Submission status"
      value={isSettable ? submission.status : ""}
      disabled={updateStatus.isPending || submission.status === "withdrawn"}
      onChange={(event) => {
        if (isCompanySettableStatus(event.target.value)) {
          updateStatus.mutate(event.target.value);
        }
      }}
      className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {!isSettable && (
        <option value="" disabled>
          {SUBMISSION_STATUS_LABELS[submission.status]}
        </option>
      )}
      {COMPANY_SETTABLE_STATUSES.map((status) => (
        <option key={status} value={status}>
          {SUBMISSION_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
