import { useMemo } from "react";

import type { FilterOption } from "@/shared/ui-components/data/ListToolbar";
import type { AdminListParams } from "../keys";
import {
  useAdminCompanies,
  useAdminJobs,
  useAdminRecruiters,
} from "./useAdmin";

/**
 * The admin list endpoints' page-size ceiling. One page is the whole
 * marketplace for now; past it the pickers would need a search endpoint.
 */
const ALL_ROWS: AdminListParams = { page: 1, limit: 1000 };

const byLabel = (a: FilterOption, b: FilterOption) =>
  a.label.localeCompare(b.label);

/**
 * Options for the submissions board's job, company and recruiter pickers.
 * Jobs stay newest first (the ones being worked on) and narrow to the chosen
 * company; companies and recruiters are alphabetical, since they are looked
 * up by name.
 */
export function useSubmissionFilterOptions(companyProfileId: string) {
  const jobs = useAdminJobs(ALL_ROWS);
  const companies = useAdminCompanies(ALL_ROWS);
  const recruiters = useAdminRecruiters(ALL_ROWS);

  const jobOptions = useMemo<FilterOption[]>(
    () =>
      (jobs.data?.data ?? []).flatMap((job) =>
        companyProfileId && job.companyProfileId !== companyProfileId
          ? []
          : [{ value: job.jobId, label: `${job.title} · ${job.companyName}` }],
      ),
    [jobs.data, companyProfileId],
  );

  const companyOptions = useMemo<FilterOption[]>(
    () =>
      (companies.data?.data ?? [])
        .map((company) => ({
          value: company.companyProfileId,
          label: company.companyName,
        }))
        .sort(byLabel),
    [companies.data],
  );

  const recruiterOptions = useMemo<FilterOption[]>(
    () =>
      (recruiters.data?.data ?? [])
        .map((recruiter) => ({
          value: recruiter.recruiterProfileId,
          label: `${recruiter.firstName} ${recruiter.lastName}`,
        }))
        .sort(byLabel),
    [recruiters.data],
  );

  return { jobOptions, companyOptions, recruiterOptions };
}
