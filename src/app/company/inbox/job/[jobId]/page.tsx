import { redirect } from "next/navigation";

/**
 * The per-job candidate list used to be a table of its own. It is now the
 * company inbox scoped by its Job filter — one table, one set of controls — so
 * this route survives only to keep old links and bookmarks working.
 */
export default function CompanyInboxJobPage({
  params,
}: {
  params: { jobId: string };
}) {
  redirect(`/company/inbox?job=${params.jobId}`);
}
