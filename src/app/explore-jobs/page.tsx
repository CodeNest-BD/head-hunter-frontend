import { PublicShell } from "@/components/landing/PublicShell";
import { ExploreJobsView } from "@/features/jobs/components/ExploreJobsView";

export const metadata = {
  title: "Explore Jobs — Head-Hunters",
  description:
    "Browse live roles and the recruiter fee each company is offering. Recruiters work the map; companies set the price.",
};

/** Public explore page: job cards for everyone, the live map for verified recruiters. */
export default function ExploreJobsPage() {
  return (
    <PublicShell>
      <ExploreJobsView />
    </PublicShell>
  );
}
