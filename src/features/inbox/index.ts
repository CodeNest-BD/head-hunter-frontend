"use client";

// The barrel is a client boundary: it re-exports components and hooks that use
// client-only React APIs, so a Server Component importing this file must not
// pull them into the server graph.
/**
 * Public surface of the inbox feature — the company's and the recruiter's
 * drill-down: jobs → candidates → that candidate's conversation. Import from
 * "@/features/inbox" only; api/, hooks/ and components/ are internal.
 */
export { InboxCandidatesTable } from "./components/InboxCandidatesTable";
export { InboxJobsTable } from "./components/InboxJobsTable";
export { useInboxCandidates, useInboxJobs } from "./hooks/useInbox";
export { inboxKeys } from "./keys";
export type { InboxSide } from "./api/inbox";
export {
  recruiterDisplayName,
  type InboxCandidateRow,
  type InboxJobRow,
  type RecruiterSummary,
} from "./schemas";
