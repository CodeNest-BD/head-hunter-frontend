import { ExploreJobsShell } from "@/features/jobs/components/ExploreJobsShell";

export const metadata = {
  title: "Explore Jobs — Head-Hunters",
  description:
    "Browse live roles and the recruiter fee each company is offering. Recruiters work the map; companies set the price.",
};

/**
 * Explore page for guests and signed-in users alike. This stays a server
 * component so the metadata above is still emitted for crawlers; the shell
 * choice happens client-side, where the session is known.
 */
export default function ExploreJobsPage() {
  return <ExploreJobsShell />;
}
