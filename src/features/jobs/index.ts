"use client";

// The barrel is a client boundary: it re-exports hooks and components that
// use client-only React APIs, so a Server Component importing this file must
// not pull them into the server graph.
/** Public surface of the jobs feature. */
export { JobForm } from "./components/JobForm";
export { JobsTable } from "./components/JobsTable";
export {
  useCreateAndPublishJob,
  useCreateJob,
  useJob,
  useJobMap,
  useJobs,
  usePublishJob,
  useUpdateJob,
} from "./hooks/useJobs";
export { usePublicJobStats, usePublicJobMap } from "./hooks/usePublicJobs";
export { jobKeys, publicJobKeys } from "./keys";
export type {
  EmploymentType,
  Job,
  JobMapEntry,
  JobStatus,
  RoleCategory,
} from "./schemas";
export { ROLE_CATEGORIES } from "./schemas";
export { ROLE_CATEGORY_LABELS } from "./schemas";
export { EMPLOYMENT_TYPE_LABELS } from "./schemas";
export type { PublicJobStats, PublicJobMapEntry } from "./publicSchemas";
