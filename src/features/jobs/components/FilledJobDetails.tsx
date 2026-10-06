import { Lock } from "lucide-react";

import { Alert } from "@/shared/ui-components/feedback/Alert";

import type { Job } from "../schemas";
import { jobToJobView } from "../utils/toJobView";
import { JobDetailBody } from "./JobDetailView";

/** Stands in for the job editor once a hire has locked the job. */
export function FilledJobDetails({ job }: { job: Job }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info" icon={Lock}>
        A candidate was hired for this job, so its details are locked.
      </Alert>
      <JobDetailBody job={jobToJobView(job)} />
    </div>
  );
}
